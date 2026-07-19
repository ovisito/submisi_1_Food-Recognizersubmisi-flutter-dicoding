export interface ScannedFood {
  id: number;
  name: string;
  confidence: number;
  imagePath: string; // Data URL / Object URL for display
  timestamp: number;
  
  // Nutrition Info
  calories: number;
  carbs: number;
  fat: number;
  fiber: number;
  protein: number;
  
  // Recipe Info (from MealDB)
  hasRecipe: boolean;
  recipeTitle: string;
  recipeThumb: string;
  recipeIngredients: string; // Semicolon separated list
  recipeInstructions: string;
}
