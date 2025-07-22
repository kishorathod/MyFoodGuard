import api from './api.js';
import { logError, logInfo } from '../utils/logger.js';

class RecipeService {
  // Test API connectivity
  async testAPIConnection() {
    try {
      logInfo('Testing recipe API connection');
      const recipes = await api.get('/recipes');
      return {
        success: true,
        message: 'Recipe API is working',
        recipeCount: recipes.length
      };
    } catch (error) {
      logError('Recipe API connection test failed', error);
      return {
        success: false,
        message: 'Recipe API connection failed',
        error: error.message
      };
    }
  }

  // Get recipe suggestions based on user's inventory
  async getRecipeSuggestions() {
    try {
      logInfo('Fetching recipe suggestions');
      const recipes = await api.get('/recipes');
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to fetch recipe suggestions', error);
      throw error;
    }
  }

  // Get recipes for a specific ingredient
  async getRecipesByIngredient(ingredient) {
    try {
      logInfo(`Fetching recipes for ingredient: ${ingredient}`);
      const recipes = await api.get(`/recipes/ingredient/${encodeURIComponent(ingredient)}`);
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to fetch recipes by ingredient', error);
      throw error;
    }
  }

  // Get detailed recipe information
  async getRecipeDetails(recipeId) {
    try {
      logInfo(`Fetching recipe details for ID: ${recipeId}`);
      const recipe = await api.get(`/recipes/details/${recipeId}`);
      return this.enhanceRecipe(recipe);
    } catch (error) {
      logError('Failed to fetch recipe details', error);
      throw error;
    }
  }

  // Search recipes with filters
  async searchRecipes(query, filters = {}) {
    try {
      logInfo(`Searching recipes with query: ${query}`);
      const params = new URLSearchParams({
        query: query,
        ...filters
      });
      const recipes = await api.get(`/recipes/search?${params}`);
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to search recipes', error);
      throw error;
    }
  }

  // Get trending recipes
  async getTrendingRecipes() {
    try {
      logInfo('Fetching trending recipes');
      const recipes = await api.get('/recipes/trending');
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to fetch trending recipes', error);
      throw error;
    }
  }

  // Get recipes by cuisine
  async getRecipesByCuisine(cuisine) {
    try {
      logInfo(`Fetching recipes for cuisine: ${cuisine}`);
      const recipes = await api.get(`/recipes/cuisine/${encodeURIComponent(cuisine)}`);
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to fetch recipes by cuisine', error);
      throw error;
    }
  }

  // Get recipes by diet type
  async getRecipesByDiet(diet) {
    try {
      logInfo(`Fetching recipes for diet: ${diet}`);
      const recipes = await api.get(`/recipes/diet/${encodeURIComponent(diet)}`);
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to fetch recipes by diet', error);
      throw error;
    }
  }

  // Get random recipes
  async getRandomRecipes(count = 5) {
    try {
      logInfo(`Fetching ${count} random recipes`);
      const recipes = await api.get(`/recipes/random?count=${count}`);
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to fetch random recipes', error);
      throw error;
    }
  }

  // Save recipe to favorites
  async saveRecipeToFavorites(recipeId) {
    try {
      logInfo(`Saving recipe to favorites: ${recipeId}`);
      await api.post('/recipes/favorites', { recipeId });
      return true;
    } catch (error) {
      logError('Failed to save recipe to favorites', error);
      throw error;
    }
  }

  // Get user's favorite recipes
  async getFavoriteRecipes() {
    try {
      logInfo('Fetching favorite recipes');
      const recipes = await api.get('/recipes/favorites');
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to fetch favorite recipes', error);
      throw error;
    }
  }

  // Remove recipe from favorites
  async removeRecipeFromFavorites(recipeId) {
    try {
      logInfo(`Removing recipe from favorites: ${recipeId}`);
      await api.delete(`/recipes/favorites/${recipeId}`);
      return true;
    } catch (error) {
      logError('Failed to remove recipe from favorites', error);
      throw error;
    }
  }

  // Rate a recipe
  async rateRecipe(recipeId, rating) {
    try {
      logInfo(`Rating recipe ${recipeId} with ${rating} stars`);
      await api.post(`/recipes/${recipeId}/rate`, { rating });
      return true;
    } catch (error) {
      logError('Failed to rate recipe', error);
      throw error;
    }
  }

  // Add recipe review
  async addRecipeReview(recipeId, review) {
    try {
      logInfo(`Adding review to recipe: ${recipeId}`);
      await api.post(`/recipes/${recipeId}/review`, review);
      return true;
    } catch (error) {
      logError('Failed to add recipe review', error);
      throw error;
    }
  }

  // Get recipe reviews
  async getRecipeReviews(recipeId) {
    try {
      logInfo(`Fetching reviews for recipe: ${recipeId}`);
      const reviews = await api.get(`/recipes/${recipeId}/reviews`);
      return reviews;
    } catch (error) {
      logError('Failed to fetch recipe reviews', error);
      throw error;
    }
  }

  // Share recipe
  async shareRecipe(recipeId, platform = 'email') {
    try {
      logInfo(`Sharing recipe ${recipeId} via ${platform}`);
      const shareData = await api.post(`/recipes/${recipeId}/share`, { platform });
      return shareData;
    } catch (error) {
      logError('Failed to share recipe', error);
      throw error;
    }
  }

  // Get nutritional information for recipe
  async getRecipeNutrition(recipeId) {
    try {
      logInfo(`Fetching nutrition for recipe: ${recipeId}`);
      const nutrition = await api.get(`/recipes/${recipeId}/nutrition`);
      return nutrition;
    } catch (error) {
      logError('Failed to fetch recipe nutrition', error);
      throw error;
    }
  }

  // Get similar recipes
  async getSimilarRecipes(recipeId) {
    try {
      logInfo(`Fetching similar recipes for: ${recipeId}`);
      const recipes = await api.get(`/recipes/${recipeId}/similar`);
      return this.enhanceRecipes(recipes);
    } catch (error) {
      logError('Failed to fetch similar recipes', error);
      throw error;
    }
  }

  // Convert recipe to shopping list
  async convertToShoppingList(recipeId) {
    try {
      logInfo(`Converting recipe ${recipeId} to shopping list`);
      const shoppingList = await api.post(`/recipes/${recipeId}/shopping-list`);
      return shoppingList;
    } catch (error) {
      logError('Failed to convert recipe to shopping list', error);
      throw error;
    }
  }

  // Enhance recipe data with additional information
  enhanceRecipe(recipe) {
    if (!recipe) return null;

    return {
      ...recipe,
      // Add default values for missing properties
      image: recipe.image || this.getDefaultRecipeImage(recipe.title),
      readyInMinutes: recipe.readyInMinutes || 30,
      servings: recipe.servings || 2,
      difficulty: this.calculateDifficulty(recipe),
      rating: recipe.rating || 4.0,
      category: recipe.category || this.categorizeRecipe(recipe),
      // Add nutritional info if available
      nutrition: recipe.nutrition || null,
      // Add user interaction data
      isFavorite: recipe.isFavorite || false,
      userRating: recipe.userRating || null,
      // Add sharing data
      shareUrl: recipe.sourceUrl || recipe.shareUrl,
      // Add preparation steps if available
      instructions: recipe.instructions || recipe.analyzedInstructions || [],
      // Add tags
      tags: recipe.tags || this.generateTags(recipe),
    };
  }

  // Enhance multiple recipes
  enhanceRecipes(recipes) {
    if (!Array.isArray(recipes)) return [];
    return recipes.map(recipe => this.enhanceRecipe(recipe));
  }

  // Get default recipe image based on title
  getDefaultRecipeImage(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('pasta') || titleLower.includes('noodle')) return '🍝';
    if (titleLower.includes('salad')) return '🥗';
    if (titleLower.includes('soup')) return '🍲';
    if (titleLower.includes('cake') || titleLower.includes('dessert')) return '🍰';
    if (titleLower.includes('bread') || titleLower.includes('toast')) return '🍞';
    if (titleLower.includes('chicken') || titleLower.includes('poultry')) return '🍗';
    if (titleLower.includes('fish') || titleLower.includes('seafood')) return '🐟';
    if (titleLower.includes('vegetable') || titleLower.includes('veggie')) return '🥬';
    if (titleLower.includes('fruit')) return '🍎';
    if (titleLower.includes('smoothie') || titleLower.includes('juice')) return '🥤';
    return '🍽️';
  }

  // Calculate recipe difficulty based on ingredients and time
  calculateDifficulty(recipe) {
    const ingredientCount = recipe.usedIngredients?.length || 0;
    const time = recipe.readyInMinutes || 30;

    if (ingredientCount <= 3 && time <= 15) return 'Easy';
    if (ingredientCount <= 6 && time <= 30) return 'Medium';
    return 'Hard';
  }

  // Categorize recipe based on ingredients and title
  categorizeRecipe(recipe) {
    const title = recipe.title?.toLowerCase() || '';
    const ingredients = recipe.usedIngredients?.map(i => i.name.toLowerCase()) || [];

    if (title.includes('breakfast') || title.includes('pancake') || title.includes('toast')) return 'Breakfast';
    if (title.includes('lunch') || title.includes('sandwich')) return 'Lunch';
    if (title.includes('dinner') || title.includes('main')) return 'Main Course';
    if (title.includes('dessert') || title.includes('cake') || title.includes('cookie')) return 'Dessert';
    if (title.includes('soup') || title.includes('stew')) return 'Soup';
    if (title.includes('salad')) return 'Salad';
    if (title.includes('snack') || title.includes('appetizer')) return 'Snack';
    if (title.includes('drink') || title.includes('smoothie')) return 'Beverage';

    // Check ingredients for categorization
    if (ingredients.some(i => i.includes('pasta') || i.includes('noodle'))) return 'Main Course';
    if (ingredients.some(i => i.includes('fruit'))) return 'Dessert';
    if (ingredients.some(i => i.includes('vegetable') || i.includes('veggie'))) return 'Side Dish';

    return 'Main Course';
  }

  // Generate tags for recipe
  generateTags(recipe) {
    const tags = [];
    const title = recipe.title?.toLowerCase() || '';
    const ingredients = recipe.usedIngredients?.map(i => i.name.toLowerCase()) || [];

    // Add dietary tags
    if (ingredients.some(i => i.includes('vegetable') || i.includes('veggie'))) tags.push('Vegetarian');
    if (ingredients.some(i => i.includes('fruit'))) tags.push('Fruit');
    if (ingredients.some(i => i.includes('chicken') || i.includes('meat'))) tags.push('Protein');
    if (ingredients.some(i => i.includes('dairy') || i.includes('milk') || i.includes('cheese'))) tags.push('Dairy');

    // Add time-based tags
    if (recipe.readyInMinutes <= 15) tags.push('Quick');
    if (recipe.readyInMinutes <= 30) tags.push('Fast');
    if (recipe.readyInMinutes > 60) tags.push('Slow Cook');

    // Add difficulty tags
    tags.push(recipe.difficulty || this.calculateDifficulty(recipe));

    return tags;
  }

  // Filter recipes by various criteria
  filterRecipes(recipes, filters = {}) {
    return recipes.filter(recipe => {
      // Filter by difficulty
      if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;

      // Filter by max time
      if (filters.maxTime && recipe.readyInMinutes > filters.maxTime) return false;

      // Filter by servings
      if (filters.minServings && recipe.servings < filters.minServings) return false;
      if (filters.maxServings && recipe.servings > filters.maxServings) return false;

      // Filter by rating
      if (filters.minRating && recipe.rating < filters.minRating) return false;

      // Filter by category
      if (filters.category && recipe.category !== filters.category) return false;

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        const recipeTags = recipe.tags || [];
        if (!filters.tags.some(tag => recipeTags.includes(tag))) return false;
      }

      return true;
    });
  }

  // Sort recipes by various criteria
  sortRecipes(recipes, sortBy = 'relevance') {
    const sorted = [...recipes];

    switch (sortBy) {
      case 'time':
        return sorted.sort((a, b) => (a.readyInMinutes || 0) - (b.readyInMinutes || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'servings':
        return sorted.sort((a, b) => (a.servings || 0) - (b.servings || 0));
      case 'difficulty':
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        return sorted.sort((a, b) => 
          (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2)
        );
      case 'name':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default:
        return sorted;
    }
  }
}

export default new RecipeService(); 