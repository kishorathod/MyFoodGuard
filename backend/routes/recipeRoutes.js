import express from "express";
import { 
  getRecipeSuggestions, 
  getRecipeByIngredient, 
  getRecipeDetails,
  searchRecipes,
  getTrendingRecipes,
  getRandomRecipes,
  getRecipeNutrition,
  getSimilarRecipes,
  shareRecipe,
  convertToShoppingList,
  getCuisineRecipes,
  getDietRecipes
} from "../controllers/recipeController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get recipe suggestions based on user's inventory
router.get("/", protect, getRecipeSuggestions);

// Get recipes for a specific ingredient
router.get("/ingredient/:ingredient", protect, getRecipeByIngredient);

// Get detailed recipe information
router.get("/details/:id", protect, getRecipeDetails);

// Search recipes with filters
router.get("/search", protect, searchRecipes);

// Get trending recipes
router.get("/trending", protect, getTrendingRecipes);

// Get random recipes
router.get("/random", protect, getRandomRecipes);

// Get recipe nutrition information
router.get("/:id/nutrition", protect, getRecipeNutrition);

// Get similar recipes
router.get("/:id/similar", protect, getSimilarRecipes);

// Share recipe
router.post("/:id/share", protect, shareRecipe);

// Convert recipe to shopping list
router.post("/:id/shopping-list", protect, convertToShoppingList);

// Get recipes by cuisine
router.get("/cuisine/:cuisine", protect, getCuisineRecipes);

// Get recipes by diet
router.get("/diet/:diet", protect, getDietRecipes);

export default router;
