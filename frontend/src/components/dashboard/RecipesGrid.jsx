import { FaExternalLinkAlt, FaUtensils, FaClock, FaUsers } from "react-icons/fa";
import { FiChevronRight } from "react-icons/fi";

export default function RecipesGrid({ recipes }) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FaUtensils className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No recipes available</h3>
            <p className="text-muted-foreground">Add more items to your inventory to get recipe suggestions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <article
          key={recipe.id}
          className="card p-6 hover:shadow-lg transition-all duration-200 group"
        >
          {/* Recipe Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {recipe.title}
            </h3>
            
            {/* Recipe Meta */}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              {recipe.readyInMinutes && (
                <div className="flex items-center space-x-1">
                  <FaClock className="h-3 w-3" />
                  <span>{recipe.readyInMinutes} min</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center space-x-1">
                  <FaUsers className="h-3 w-3" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Ingredients Available:</h4>
            <div className="space-y-1">
              {recipe.usedIngredients?.slice(0, 3).map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-sm text-muted-foreground">{ingredient.name}</span>
                </div>
              ))}
              {recipe.usedIngredients?.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{recipe.usedIngredients.length - 3} more ingredients
                </div>
              )}
            </div>
          </div>

          {/* Missing Ingredients */}
          {recipe.missedIngredients && recipe.missedIngredients.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Missing Ingredients:</h4>
              <div className="space-y-1">
                {recipe.missedIngredients.slice(0, 2).map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span className="text-sm text-muted-foreground">{ingredient.name}</span>
                  </div>
                ))}
                {recipe.missedIngredients.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{recipe.missedIngredients.length - 2} more needed
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recipe Link */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FaUtensils className="h-4 w-4" />
              <span>Recipe</span>
            </div>
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View full recipe for ${recipe.title}`}
              className="flex items-center space-x-1 text-primary hover:text-primary/80 transition-colors group/link"
            >
              <span className="text-sm font-medium">View Recipe</span>
              <FiChevronRight className="h-4 w-4 group-hover/link:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
