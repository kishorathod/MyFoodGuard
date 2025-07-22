# Recipe API Setup Guide

This guide will help you set up the advanced recipe features in FoodGuard with multiple API providers for maximum reliability and functionality.

## 🍳 Features Added

### Core Features
- **Real Recipe API Integration**: Connect to Spoonacular and Edamam APIs
- **Smart Ingredient Matching**: Automatically find recipes using your expiring ingredients
- **Advanced Filtering**: Filter by difficulty, time, rating, category, and more
- **Recipe Search**: Search recipes with various criteria
- **Nutritional Information**: Get detailed nutrition data for recipes
- **Recipe Sharing**: Share recipes via email, Twitter, Facebook
- **Shopping List Conversion**: Convert recipe ingredients to shopping lists
- **Similar Recipes**: Find similar recipes based on current selection
- **Trending & Random Recipes**: Discover new recipes

### Advanced Features
- **Multiple API Support**: Spoonacular (primary) + Edamam (backup)
- **Fallback System**: Local recipes when APIs are unavailable
- **Enhanced UI**: Modern filtering, sorting, and search interface
- **Nutritional Data**: Calories, protein, carbs, fat information
- **Recipe Instructions**: Step-by-step cooking instructions
- **Ingredient Analysis**: Shows what you have vs. what you need
- **Responsive Design**: Works on all devices with dark/light mode

## 🔑 API Setup

### 1. Spoonacular API (Primary)

Spoonacular is the primary recipe API with comprehensive features.

#### Get API Key
1. Go to [Spoonacular API](https://spoonacular.com/food-api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes 150 requests/day

#### Environment Variable
Add to your `.env` file:
```env
SPOONACULAR_KEY=your_spoonacular_api_key_here
```

### 2. Edamam API (Backup)

Edamam provides a backup API with different recipe sources.

#### Get API Credentials
1. Go to [Edamam API](https://developer.edamam.com/edamam-recipe-api)
2. Sign up for a free account
3. Create a new application
4. Get your App ID and App Key

#### Environment Variables
Add to your `.env` file:
```env
EDAMAM_APP_ID=your_edamam_app_id_here
EDAMAM_APP_KEY=your_edamam_app_key_here
```

## 🚀 Installation & Setup

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install axios
```

2. **Environment Variables**
Create or update your `.env` file in the backend directory:
```env
# Recipe APIs
SPOONACULAR_KEY=your_spoonacular_api_key_here
EDAMAM_APP_ID=your_edamam_app_id_here
EDAMAM_APP_KEY=your_edamam_app_key_here

# Other existing variables...
```

3. **Restart Backend**
```bash
npm run dev
```

### Frontend Setup

The frontend automatically includes the new recipe service. No additional setup required.

## 📋 API Endpoints

### Recipe Suggestions
- `GET /api/recipes` - Get recipes based on user's inventory

### Recipe Search & Discovery
- `GET /api/recipes/search` - Search recipes with filters
- `GET /api/recipes/trending` - Get trending recipes
- `GET /api/recipes/random` - Get random recipes
- `GET /api/recipes/cuisine/:cuisine` - Get recipes by cuisine
- `GET /api/recipes/diet/:diet` - Get recipes by diet

### Recipe Details
- `GET /api/recipes/details/:id` - Get detailed recipe information
- `GET /api/recipes/:id/nutrition` - Get nutrition information
- `GET /api/recipes/:id/similar` - Get similar recipes

### Recipe Actions
- `POST /api/recipes/:id/share` - Share recipe
- `POST /api/recipes/:id/shopping-list` - Convert to shopping list

### Ingredient Search
- `GET /api/recipes/ingredient/:ingredient` - Find recipes by ingredient

## 🎯 Usage Examples

### Search Recipes
```javascript
// Search for vegetarian recipes under 30 minutes
const recipes = await recipeService.searchRecipes('pasta', {
  diet: 'vegetarian',
  maxReadyTime: 30
});
```

### Get Trending Recipes
```javascript
const trending = await recipeService.getTrendingRecipes();
```

### Get Recipe Nutrition
```javascript
const nutrition = await recipeService.getRecipeNutrition(recipeId);
```

### Share Recipe
```javascript
const shareData = await recipeService.shareRecipe(recipeId, 'email');
```

## 🔧 Advanced Configuration

### API Rate Limiting
The backend includes built-in rate limiting and error handling:
- Spoonacular: 150 requests/day (free tier)
- Edamam: 10 requests/minute (free tier)
- Automatic fallback to local recipes

### Custom Recipe Sources
You can add more recipe APIs by:
1. Adding new API credentials to `.env`
2. Creating helper functions in `recipeController.js`
3. Adding fallback logic

### Recipe Categories
Supported categories:
- Main Course
- Breakfast
- Lunch
- Dinner
- Dessert
- Soup
- Salad
- Snack
- Beverage

### Dietary Options
Supported diets:
- Vegetarian
- Vegan
- Gluten-Free
- Dairy-Free
- Low-Carb
- Keto
- Paleo

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify your API key is correct
   - Check if you've exceeded rate limits
   - Ensure the key is properly set in `.env`

2. **No Recipes Found**
   - Check if ingredients are properly formatted
   - Verify API responses in browser console
   - Check fallback recipes are working

3. **Nutrition Data Missing**
   - Some recipes may not have nutrition data
   - Check if the recipe ID is valid
   - Verify API endpoint is accessible

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
```

### API Status Check
Test your API connections:
```bash
# Test Spoonacular
curl "https://api.spoonacular.com/recipes/random?apiKey=YOUR_KEY&number=1"

# Test Edamam
curl "https://api.edamam.com/api/recipes/v2?app_id=YOUR_APP_ID&app_key=YOUR_APP_KEY&q=pasta&from=0&to=1"
```

## 📊 Performance Optimization

### Caching
Consider implementing caching for:
- Recipe search results
- Nutrition data
- Trending recipes

### Rate Limiting
- Monitor API usage
- Implement request queuing
- Use fallback recipes when limits are reached

### Error Handling
- Graceful degradation when APIs fail
- User-friendly error messages
- Automatic retry logic

## 🔒 Security Considerations

1. **API Key Protection**
   - Never expose API keys in frontend code
   - Use environment variables
   - Rotate keys regularly

2. **Request Validation**
   - Validate all user inputs
   - Sanitize search queries
   - Limit request sizes

3. **Rate Limiting**
   - Implement per-user rate limiting
   - Monitor for abuse
   - Block suspicious requests

## 🎨 UI Customization

The recipe interface supports:
- Light/Dark mode
- Responsive design
- Custom color schemes
- Accessibility features

## 📈 Monitoring

Monitor your recipe API usage:
- Track request counts
- Monitor response times
- Alert on errors
- Log usage patterns

## 🚀 Deployment

### Environment Variables
Ensure all API keys are set in your deployment environment:
- Vercel/Netlify: Set in dashboard
- Heroku: Use `heroku config:set`
- Railway: Set in dashboard

### API Limits
Consider upgrading API plans for production:
- Spoonacular: $10/month for 1,500 requests/day
- Edamam: $49/month for 10,000 requests/month

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify API credentials
3. Test API endpoints directly
4. Check rate limits
5. Review server logs

## 🎉 Next Steps

With the recipe system set up, you can:
1. Add more recipe sources
2. Implement recipe favorites
3. Add meal planning features
4. Create recipe collections
5. Add user reviews and ratings
6. Implement recipe recommendations

The advanced recipe system is now ready to help users reduce food waste by finding delicious recipes for their expiring ingredients! 