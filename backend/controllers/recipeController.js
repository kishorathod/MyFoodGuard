import axios from "axios";
import dotenv from "dotenv";
import FoodItem from "../models/FoodItem.js";

dotenv.config();

const SPOONACULAR_KEY = process.env.SPOONACULAR_KEY;
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

// Fallback recipes when API is unavailable
const FALLBACK_RECIPES = [
  {
    id: 1,
    title: "Quick Vegetable Stir Fry",
    usedIngredients: [{ name: "vegetables" }],
    missedIngredients: [{ name: "soy sauce" }],
    sourceUrl: "https://www.loveandlemons.com/vegetable-stir-fry/",
    readyInMinutes: 20,
    servings: 2,
    difficulty: "Easy",
    rating: 4.2,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 2,
    title: "Simple Fruit Salad",
    usedIngredients: [{ name: "fruits" }],
    missedIngredients: [],
    sourceUrl: "https://www.simplyrecipes.com/recipes/fruit_salad/",
    readyInMinutes: 10,
    servings: 4,
    difficulty: "Easy",
    rating: 4.5,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 3,
    title: "Basic Pasta with Vegetables",
    usedIngredients: [{ name: "vegetables" }],
    missedIngredients: [{ name: "pasta" }],
    sourceUrl: "https://www.bbcgoodfood.com/recipes/collection/vegetarian-pasta-recipes",
    readyInMinutes: 25,
    servings: 2,
    difficulty: "Medium",
    rating: 4.0,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80"
  }
];

// Helper function to call Spoonacular API
const callSpoonacularAPI = async (endpoint, params = {}) => {
  if (!SPOONACULAR_KEY) return null;
  
  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/${endpoint}`, {
      params: {
        apiKey: SPOONACULAR_KEY,
        ...params
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Spoonacular API error:', error.response?.data || error.message);
    return null;
  }
};

// Helper function to call Edamam API
const callEdamamAPI = async (endpoint, params = {}) => {
  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) return null;
  try {
    const response = await axios.get(
      `https://api.edamam.com/api/recipes/v2/${endpoint}`,
      {
        params: {
          app_id: EDAMAM_APP_ID,
          app_key: EDAMAM_APP_KEY,
          type: 'public',
          ...params
        },
        timeout: 10000,
        headers: {
          'Edamam-Account-User': process.env.EDAMAM_USER_ID || ''
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Edamam API error:', error.response?.data || error.message);
    return null;
  }
};

export const getRecipeSuggestions = async (req, res) => {
  try {
    console.log("🍳 Recipe request received");
    
    // Get user's inventory
    const items = await FoodItem.find({ userId: req.user._id });
    
    if (items.length === 0) {
      console.log("📦 No items in inventory, returning fallback recipes");
      return res.json(FALLBACK_RECIPES);
    }

    // Extract ingredient names and filter out expired items
    const validItems = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      return expiryDate > today;
    });

    if (validItems.length === 0) {
      console.log("⚠️ All items expired, returning fallback recipes");
      return res.json(FALLBACK_RECIPES);
    }

    // Create ingredient string for API
    const ingredients = validItems
      .map(item => item.name.toLowerCase())
      .join(",");

    console.log("🔍 Ingredients for recipe search:", ingredients);

    // Try Spoonacular API first
    let recipes = await callSpoonacularAPI('findByIngredients', {
      ingredients,
      number: 8,
      ranking: 2,
      ignorePantry: true,
    });

    // If Spoonacular fails, try Edamam
    if (!recipes || recipes.length === 0) {
      console.log("🔄 Trying Edamam API...");
      const edamamResponse = await callEdamamAPI('', {
        q: ingredients,
        from: 0,
        to: 8,
      });
      
      if (edamamResponse && edamamResponse.hits) {
        recipes = edamamResponse.hits.map(hit => ({
          id: hit.recipe.uri.split('#recipe_')[1],
          title: hit.recipe.label,
          usedIngredients: hit.recipe.ingredientLines.map(ing => ({ name: ing })),
          missedIngredients: [],
          sourceUrl: hit.recipe.url,
          readyInMinutes: Math.round(hit.recipe.totalTime),
          servings: Math.round(hit.recipe.yield),
          image: hit.recipe.image,
          difficulty: hit.recipe.totalTime > 60 ? 'Hard' : hit.recipe.totalTime > 30 ? 'Medium' : 'Easy',
          rating: 4.0,
          category: 'Main Course'
        }));
      }
    }

    if (recipes && recipes.length > 0) {
      console.log("✅ API success:", recipes.length, "recipes");
      
      // Enhance recipes with additional data
      const enhancedRecipes = await Promise.all(
        recipes.slice(0, 6).map(async (recipe) => {
          try {
            // Get detailed recipe information from Spoonacular
            const details = await callSpoonacularAPI(`${recipe.id}/information`);
            
            if (details) {
              return {
                ...recipe,
                readyInMinutes: details.readyInMinutes || recipe.readyInMinutes || 30,
                servings: details.servings || recipe.servings || 2,
                sourceUrl: details.sourceUrl || recipe.sourceUrl,
                image: details.image || recipe.image,
                instructions: details.instructions || [],
                nutrition: details.nutrition || null,
                difficulty: details.readyInMinutes > 60 ? 'Hard' : details.readyInMinutes > 30 ? 'Medium' : 'Easy',
                rating: details.spoonacularScore ? details.spoonacularScore / 20 : 4.0,
                category: details.cuisines?.[0] || 'Main Course',
              };
            }
            
            return {
              ...recipe,
              readyInMinutes: recipe.readyInMinutes || 30,
              servings: recipe.servings || 2,
              difficulty: recipe.difficulty || 'Medium',
              rating: recipe.rating || 4.0,
              category: recipe.category || 'Main Course',
            };
          } catch (detailError) {
            console.log("⚠️ Could not get details for recipe", recipe.id);
            return {
              ...recipe,
              readyInMinutes: recipe.readyInMinutes || 30,
              servings: recipe.servings || 2,
              difficulty: recipe.difficulty || 'Medium',
              rating: recipe.rating || 4.0,
              category: recipe.category || 'Main Course',
            };
          }
        })
      );

      return res.json(enhancedRecipes);
    } else {
      console.log("⚠️ No recipes found from APIs, using fallback");
      return res.json(FALLBACK_RECIPES);
    }
  } catch (error) {
    console.error("💥 Recipe controller error:", error);
    res.status(500).json({ 
      message: "Failed to fetch recipes. Please try again later.",
      error: error.message 
    });
  }
};

export const getRecipeByIngredient = async (req, res) => {
  try {
    const { ingredient } = req.params;
    
    if (!ingredient) {
      return res.status(400).json({ message: "Ingredient parameter is required" });
    }

    console.log("🔍 Searching recipes for ingredient:", ingredient);

    // Try Spoonacular first
    let recipes = await callSpoonacularAPI('findByIngredients', {
      ingredients: ingredient,
      number: 5,
      ranking: 2,
      ignorePantry: true,
    });

    // If Spoonacular fails, try Edamam
    if (!recipes || recipes.length === 0) {
      const edamamResponse = await callEdamamAPI('', {
        q: ingredient,
        from: 0,
        to: 5,
      });
      
      if (edamamResponse && edamamResponse.hits) {
        recipes = edamamResponse.hits.map(hit => ({
          id: hit.recipe.uri.split('#recipe_')[1],
          title: hit.recipe.label,
          usedIngredients: hit.recipe.ingredientLines.map(ing => ({ name: ing })),
          missedIngredients: [],
          sourceUrl: hit.recipe.url,
          readyInMinutes: Math.round(hit.recipe.totalTime),
          servings: Math.round(hit.recipe.yield),
          image: hit.recipe.image,
        }));
      }
    }

    if (recipes && recipes.length > 0) {
      console.log("✅ Found", recipes.length, "recipes for", ingredient);
      return res.json(recipes);
    } else {
      console.log("⚠️ No recipes found for", ingredient);
      return res.json([]);
    }
  } catch (error) {
    console.error("💥 Ingredient search error:", error);
    res.status(500).json({ message: "Failed to search recipes" });
  }
};

export const getRecipeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const details = await callSpoonacularAPI(`${id}/information`);
    
    if (details) {
      res.json(details);
    } else {
      res.status(404).json({ message: "Recipe not found" });
    }
  } catch (error) {
    console.error("💥 Recipe details error:", error);
    res.status(500).json({ message: "Failed to fetch recipe details" });
  }
};

// New advanced features

export const searchRecipes = async (req, res) => {
  try {
    const { query, cuisine, diet, intolerances, maxReadyTime, minProtein, maxCalories } = req.query;
    
    const params = {
      query: query || '',
      number: 10,
    };

    if (cuisine) params.cuisine = cuisine;
    if (diet) params.diet = diet;
    if (intolerances) params.intolerances = intolerances;
    if (maxReadyTime) params.maxReadyTime = maxReadyTime;
    if (minProtein) params.minProtein = minProtein;
    if (maxCalories) params.maxCalories = maxCalories;

    const recipes = await callSpoonacularAPI('complexSearch', params);
    
    if (recipes && recipes.results) {
      res.json(recipes.results);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("💥 Recipe search error:", error);
    res.status(500).json({ message: "Failed to search recipes" });
  }
};

export const getTrendingRecipes = async (req, res) => {
  try {
    const recipes = await callSpoonacularAPI('random', {
      number: 8,
      tags: 'trending'
    });
    
    if (recipes && recipes.recipes) {
      res.json(recipes.recipes);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("💥 Trending recipes error:", error);
    res.status(500).json({ message: "Failed to fetch trending recipes" });
  }
};

export const getRandomRecipes = async (req, res) => {
  try {
    const { count = 5, tags } = req.query;
    
    const params = { number: parseInt(count) };
    if (tags) params.tags = tags;

    const recipes = await callSpoonacularAPI('random', params);
    
    if (recipes && recipes.recipes) {
      res.json(recipes.recipes);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("💥 Random recipes error:", error);
    res.status(500).json({ message: "Failed to fetch random recipes" });
  }
};

export const getRecipeNutrition = async (req, res) => {
  try {
    const { id } = req.params;
    
    const nutrition = await callSpoonacularAPI(`${id}/nutritionWidget.json`);
    
    if (nutrition) {
      res.json(nutrition);
    } else {
      res.status(404).json({ message: "Nutrition information not found" });
    }
  } catch (error) {
    console.error("💥 Recipe nutrition error:", error);
    res.status(500).json({ message: "Failed to fetch nutrition information" });
  }
};

export const getSimilarRecipes = async (req, res) => {
  try {
    const { id } = req.params;
    
    const similar = await callSpoonacularAPI(`${id}/similar`, {
      number: 5
    });
    
    if (similar) {
      res.json(similar);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("💥 Similar recipes error:", error);
    res.status(500).json({ message: "Failed to fetch similar recipes" });
  }
};

export const shareRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;
    
    const recipe = await callSpoonacularAPI(`${id}/information`);
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    let shareData = {
      title: recipe.title,
      url: recipe.sourceUrl || recipe.spoonacularSourceUrl,
      image: recipe.image,
    };

    // Generate share text based on platform
    switch (platform) {
      case 'email':
        shareData.text = `Check out this recipe: ${recipe.title}`;
        shareData.url = `mailto:?subject=${encodeURIComponent(recipe.title)}&body=${encodeURIComponent(`Check out this recipe: ${recipe.title}\n\n${recipe.sourceUrl}`)}`;
        break;
      case 'twitter':
        shareData.url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this recipe: ${recipe.title}`)}&url=${encodeURIComponent(recipe.sourceUrl)}`;
        break;
      case 'facebook':
        shareData.url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(recipe.sourceUrl)}`;
        break;
      default:
        shareData.text = `Check out this recipe: ${recipe.title}`;
    }

    res.json(shareData);
  } catch (error) {
    console.error("💥 Recipe share error:", error);
    res.status(500).json({ message: "Failed to share recipe" });
  }
};

export const convertToShoppingList = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recipe = await callSpoonacularAPI(`${id}/information`);
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // Extract ingredients for shopping list
    const shoppingList = recipe.extendedIngredients?.map(ingredient => ({
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      aisle: ingredient.aisle || 'General'
    })) || [];

    res.json({
      recipeTitle: recipe.title,
      ingredients: shoppingList
    });
  } catch (error) {
    console.error("💥 Shopping list conversion error:", error);
    res.status(500).json({ message: "Failed to convert recipe to shopping list" });
  }
};

export const getCuisineRecipes = async (req, res) => {
  try {
    const { cuisine } = req.params;
    
    const recipes = await callSpoonacularAPI('complexSearch', {
      cuisine: cuisine,
      number: 8
    });
    
    if (recipes && recipes.results) {
      res.json(recipes.results);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("💥 Cuisine recipes error:", error);
    res.status(500).json({ message: "Failed to fetch cuisine recipes" });
  }
};

export const getDietRecipes = async (req, res) => {
  try {
    const { diet } = req.params;
    
    const recipes = await callSpoonacularAPI('complexSearch', {
      diet: diet,
      number: 8
    });
    
    if (recipes && recipes.results) {
      res.json(recipes.results);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("💥 Diet recipes error:", error);
    res.status(500).json({ message: "Failed to fetch diet recipes" });
  }
};
