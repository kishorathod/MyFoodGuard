import { useState, useEffect } from "react";
import { 
  FiChevronRight, 
  FiClock, 
  FiStar, 
  FiUsers, 
  FiFilter, 
  FiHeart,
  FiShare2,
  FiShoppingCart,
  FiInfo,
  FiTrendingUp,
  FiSearch,
  FiX
} from "react-icons/fi";
import recipeService from "../../services/recipeService.js";

export default function SmartRecipes({ expiringItems }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [filters, setFilters] = useState({
    difficulty: '',
    maxTime: '',
    category: '',
    minRating: ''
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [similarRecipes, setSimilarRecipes] = useState([]);

  // Fetch recipes based on expiring items
  const fetchRecipes = async () => {
    if (expiringItems.length === 0) {
      setRecipes([]);
      return;
    }

    setLoading(true);
    try {
      const fetchedRecipes = await recipeService.getRecipeSuggestions();
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      // Fallback to local recipes if API fails
      setRecipes(getFallbackRecipes());
    } finally {
      setLoading(false);
    }
  };

  // Fallback recipes when API is unavailable
  const getFallbackRecipes = () => {
    const suggestions = [];
    const itemNames = expiringItems.map(item => item.name.toLowerCase());
    const itemCategories = expiringItems.map(item => (item.category || '').toLowerCase());

    if (itemNames.some(name => name.includes('milk') || name.includes('cheese') || name.includes('yogurt')) || itemCategories.includes('dairy')) {
      suggestions.push({
        id: 1,
        title: "Creamy Pasta Carbonara",
        description: "Use up your dairy products with this classic Italian dish",
        ingredients: ["Pasta", "Eggs", "Cheese", "Bacon", "Black Pepper"],
        readyInMinutes: 20,
        difficulty: "Easy",
        rating: 4.5,
        servings: 4,
        image: "🍝",
        category: "Main Course",
        usedIngredients: [{ name: "cheese" }, { name: "milk" }],
        missedIngredients: [{ name: "pasta" }, { name: "bacon" }]
      });
    }

    if (itemNames.some(name => name.includes('tomato') || name.includes('onion') || name.includes('garlic')) || itemCategories.includes('vegetables')) {
      suggestions.push({
        id: 2,
        title: "Fresh Tomato Basil Soup",
        description: "Perfect way to use up ripe tomatoes",
        ingredients: ["Tomatoes", "Basil", "Onion", "Garlic", "Olive Oil"],
        readyInMinutes: 30,
        difficulty: "Easy",
        rating: 4.3,
        servings: 6,
        image: "🍅",
        category: "Soup",
        usedIngredients: [{ name: "tomato" }, { name: "onion" }, { name: "garlic" }],
        missedIngredients: [{ name: "basil" }, { name: "olive oil" }]
      });
    }

    if (itemNames.some(name => name.includes('apple') || name.includes('banana') || name.includes('berry')) || itemCategories.includes('fruits')) {
      suggestions.push({
        id: 3,
        title: "Mixed Berry Smoothie Bowl",
        description: "Healthy breakfast using fresh fruits",
        ingredients: ["Mixed Berries", "Banana", "Yogurt", "Honey", "Granola"],
        readyInMinutes: 10,
        difficulty: "Easy",
        rating: 4.7,
        servings: 2,
        image: "🍓",
        category: "Breakfast",
        usedIngredients: [{ name: "berry" }, { name: "banana" }],
        missedIngredients: [{ name: "yogurt" }, { name: "honey" }]
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        id: 4,
        title: "Leftover Stir-Fry",
        description: "Use up any expiring vegetables and proteins",
        ingredients: ["Any Vegetables", "Protein", "Soy Sauce", "Garlic", "Oil"],
        readyInMinutes: 20,
        difficulty: "Easy",
        rating: 4.2,
        servings: 2,
        image: "🥘",
        category: "Main Course",
        usedIngredients: [{ name: "vegetables" }],
        missedIngredients: [{ name: "soy sauce" }, { name: "oil" }]
      });
    }

    return suggestions;
  };

  // Handle recipe selection and fetch additional data
  const handleRecipeSelect = async (recipe) => {
    setSelectedRecipe(recipe);
    setNutritionInfo(null);
    setSimilarRecipes([]);

    // Fetch additional data for the selected recipe
    try {
      // Get nutrition info
      const nutrition = await recipeService.getRecipeNutrition(recipe.id);
      setNutritionInfo(nutrition);

      // Get similar recipes
      const similar = await recipeService.getSimilarRecipes(recipe.id);
      setSimilarRecipes(similar);
    } catch (error) {
      console.error('Failed to fetch additional recipe data:', error);
    }
  };

  // Handle recipe sharing
  const handleShareRecipe = async (recipe, platform = 'email') => {
    try {
      await recipeService.shareRecipe(recipe.id, platform);
      // You could show a success message here
    } catch (error) {
      console.error('Failed to share recipe:', error);
    }
  };

  // Handle adding recipe to shopping list
  const handleAddToShoppingList = async (recipe) => {
    try {
      const shoppingList = await recipeService.convertToShoppingList(recipe.id);
      // You could show a success message or redirect to shopping list
      console.log('Added to shopping list:', shoppingList);
    } catch (error) {
      console.error('Failed to add to shopping list:', error);
    }
  };

  // Filter and sort recipes
  const getFilteredAndSortedRecipes = () => {
    let filtered = recipes;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(recipe => 
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply other filters
    filtered = recipeService.filterRecipes(filtered, filters);

    // Sort recipes
    return recipeService.sortRecipes(filtered, sortBy);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      difficulty: '',
      maxTime: '',
      category: '',
      minRating: ''
    });
    setSortBy('relevance');
    setSearchQuery('');
  };

  useEffect(() => {
    fetchRecipes();
  }, [expiringItems]);

  const filteredRecipes = getFilteredAndSortedRecipes();

  if (expiringItems.length === 0) {
    return (
      <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
        <div className="flex items-center space-x-3 mb-4">
          <FiClock className="h-6 w-6 text-orange-500" />
          <h3 className="text-lg font-semibold text-foreground">Smart Recipe Suggestions</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🍽️</div>
          <h4 className="text-lg font-semibold text-muted-foreground mb-2">
            No Expiring Items
          </h4>
          <p className="text-muted-foreground">
            When you have items expiring soon, we'll suggest recipes to help you use them up!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FiClock className="h-6 w-6 text-orange-500" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Smart Recipe Suggestions</h3>
            <p className="text-sm text-muted-foreground">
              Recipes to help you use up {expiringItems.length} expiring item{expiringItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Filter recipes"
          >
            <FiFilter className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={fetchRecipes}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Refresh recipes"
          >
            <FiTrendingUp className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      {showFilters && (
        <div className="mb-6 p-4 bg-secondary dark:bg-gray-900 rounded-lg border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Max Time Filter */}
            <select
              value={filters.maxTime}
              onChange={(e) => setFilters({ ...filters, maxTime: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Any Time</option>
              <option value="15">15 min or less</option>
              <option value="30">30 min or less</option>
              <option value="60">1 hour or less</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="relevance">Relevance</option>
              <option value="time">Time</option>
              <option value="rating">Rating</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FiX className="h-4 w-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finding perfect recipes for you...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-lg font-semibold text-muted-foreground mb-2">
                No recipes found
              </h4>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-secondary dark:bg-gray-900"
                onClick={() => handleRecipeSelect(recipe)}
            >
              <div className="flex items-start space-x-4">
                  <div className="text-4xl">
                    {recipe.image && recipe.image.startsWith('http') ? (
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-16 h-16 rounded-lg object-cover border border-border bg-white dark:bg-gray-800"
                        loading="lazy"
                      />
                    ) : (
                      recipe.image
                    )}
                  </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-semibold text-foreground mb-1">
                        {recipe.title}
                      </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                        {recipe.description}
                      </p>
                        
                        {/* Used Ingredients */}
                        {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Uses: {recipe.usedIngredients.map(ing => ing.name).join(', ')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                            <FiClock className="h-3 w-3" />
                            <span>{recipe.readyInMinutes} min</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FiUsers className="h-3 w-3" />
                          <span>{recipe.servings} servings</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FiStar className="h-3 w-3" />
                          <span>{recipe.rating}</span>
                        </span>
                          {recipe.difficulty && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs">
                              {recipe.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                      <FiChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Enhanced Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">
                    {selectedRecipe.image && selectedRecipe.image.startsWith('http') ? (
                      <img
                        src={selectedRecipe.image}
                        alt={selectedRecipe.title}
                        className="w-20 h-20 rounded-lg object-cover border border-border bg-white dark:bg-gray-800"
                        loading="lazy"
                      />
                    ) : (
                      selectedRecipe.image
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {selectedRecipe.title}
                    </h2>
                    <p className="text-muted-foreground">{selectedRecipe.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleShareRecipe(selectedRecipe, 'email')}
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                    title="Share recipe"
                  >
                    <FiShare2 className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleAddToShoppingList(selectedRecipe)}
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                    title="Add to shopping list"
                  >
                    <FiShoppingCart className="h-5 w-5 text-muted-foreground" />
                  </button>
                <button
                  onClick={() => setSelectedRecipe(null)}
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                    <FiX className="h-5 w-5 text-muted-foreground" />
                </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground">{selectedRecipe.description}</p>
                </div>

                  {/* Ingredients */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ingredients</h3>
                    <div className="space-y-2">
                      {selectedRecipe.usedIngredients && selectedRecipe.usedIngredients.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                            You have these:
                          </h4>
                          <ul className="space-y-1">
                            {selectedRecipe.usedIngredients.map((ingredient, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-muted-foreground">{ingredient.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {selectedRecipe.missedIngredients && selectedRecipe.missedIngredients.length > 0 && (
                <div>
                          <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                            You'll need these:
                          </h4>
                          <ul className="space-y-1">
                            {selectedRecipe.missedIngredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-muted-foreground">{ingredient.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Instructions</h3>
                      <ol className="space-y-2">
                        {selectedRecipe.instructions.map((step, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-muted-foreground">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Recipe Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-secondary dark:bg-gray-900 border border-border rounded-lg">
                      <div className="text-lg font-semibold text-foreground">
                        {selectedRecipe.readyInMinutes} min
                      </div>
                      <div className="text-sm text-muted-foreground">Prep Time</div>
                  </div>
                    <div className="text-center p-3 bg-secondary dark:bg-gray-900 border border-border rounded-lg">
                      <div className="text-lg font-semibold text-foreground">
                      {selectedRecipe.servings}
                      </div>
                      <div className="text-sm text-muted-foreground">Servings</div>
                    </div>
                  </div>

                  {/* Nutritional Info */}
                  {nutritionInfo && (
                    <div className="bg-secondary dark:bg-gray-900 border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center">
                        <FiInfo className="h-4 w-4 mr-2" />
                        Nutrition
                      </h4>
                      <div className="space-y-2 text-sm">
                        {nutritionInfo.calories && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Calories</span>
                            <span className="font-medium">{nutritionInfo.calories}</span>
                          </div>
                        )}
                        {nutritionInfo.protein && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Protein</span>
                            <span className="font-medium">{nutritionInfo.protein}g</span>
                          </div>
                        )}
                        {nutritionInfo.carbs && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Carbs</span>
                            <span className="font-medium">{nutritionInfo.carbs}g</span>
                          </div>
                        )}
                        {nutritionInfo.fat && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fat</span>
                            <span className="font-medium">{nutritionInfo.fat}g</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Similar Recipes */}
                  {similarRecipes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Similar Recipes</h4>
                      <div className="space-y-2">
                        {similarRecipes.slice(0, 3).map((recipe) => (
                          <div
                            key={recipe.id}
                            className="p-3 bg-secondary dark:bg-gray-900 border border-border rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => handleRecipeSelect(recipe)}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">
                                {recipe.image && recipe.image.startsWith('http') ? (
                                  <img
                                    src={recipe.image}
                                    alt={recipe.title}
                                    className="w-8 h-8 rounded object-cover border border-border bg-white dark:bg-gray-800"
                                    loading="lazy"
                                  />
                                ) : (
                                  recipe.image
                                )}
                              </span>
                              <div className="flex-1">
                                <h5 className="font-medium text-foreground text-sm">{recipe.title}</h5>
                                <p className="text-xs text-muted-foreground">{recipe.readyInMinutes} min</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                </div>

              <div className="flex space-x-4 pt-6 border-t border-border">
                <button 
                  onClick={() => handleAddToShoppingList(selectedRecipe)}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <FiShoppingCart className="h-4 w-4" />
                  <span>Add to Shopping List</span>
                  </button>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                  className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    Close
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 