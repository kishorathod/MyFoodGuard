import Joi from 'joi';

// Validation schemas
export const foodItemSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  category: Joi.string().required().valid(
    'Fruits', 'Vegetables', 'Dairy', 'Meat', 'Grains', 
    'Beverages', 'Snacks', 'Condiments', 'Frozen', 'Canned', 'Other',
    'fruits', 'vegetables', 'dairy', 'meat', 'grains', 
    'beverages', 'snacks', 'condiments', 'frozen', 'canned', 'other'
  ),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().required().valid(
    'kg', 'g', 'l', 'ml', 'pieces', 'packages', 'units',
    'Kilograms', 'Grams', 'Liters', 'Milliliters', 'Pieces', 'Packages', 'Units'
  ),
  expiryDate: Joi.date().iso().required(),
  price: Joi.number().positive().optional(),
  storageLocation: Joi.string().optional(),
  notes: Joi.string().max(500).optional(),
  description: Joi.string().max(500).optional()
});

export const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required().min(2).max(50)
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const recipeSchema = Joi.object({
  title: Joi.string().required().min(1).max(100),
  ingredients: Joi.array().items(Joi.string()).min(1).required(),
  instructions: Joi.array().items(Joi.string()).min(1).required(),
  cookingTime: Joi.number().positive().optional(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').optional(),
  servings: Joi.number().positive().optional()
});

// Validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    req.validatedData = value;
    next();
  };
};

// Helper function to validate dates
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Helper function to validate expiry date
export const isValidExpiryDate = (expiryDate) => {
  const date = new Date(expiryDate);
  const today = new Date();
  return date instanceof Date && !isNaN(date) && date > today;
}; 