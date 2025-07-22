import foodService from "../services/foodService.js";
import { successResponse, errorResponse, validationError } from "../utils/responseHandler.js";
import { validateRequest, foodItemSchema } from "../utils/validation.js";
import axios from "axios";
import Notification from '../models/Notification.js';

// @desc    Test endpoint
export const testEndpoint = async (req, res) => {
  try {
    return successResponse(res, { message: 'Backend is working!' }, 'Test successful');
  } catch (error) {
    return errorResponse(res, error, 'Test failed');
  }
};

// @desc    Test database connection
export const testDatabase = async (req, res) => {
  try {
    // Test database connection by trying to create a simple item
    const testData = {
      name: 'Test Item',
      quantity: 1,
      unit: 'units',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      category: 'other',
      userId: req.user._id
    };
    
    const result = await foodService.createFoodItem(testData, req.user._id);
    
    if (result.success) {
      // Delete the test item
      await foodService.deleteFoodItem(result.data._id, req.user._id);
      return successResponse(res, { message: 'Database connection successful!' }, 'Database test successful');
    } else {
      return errorResponse(res, null, result.error, 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Database test failed');
  }
};

// Utility validation function
const validateFoodInput = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0)
    errors.push("Name is required and must be a non-empty string.");
  
  // Convert quantity to number if it's a string
  const quantity = parseFloat(data.quantity);
  if (isNaN(quantity) || quantity <= 0)
    errors.push("Quantity is required and must be a positive number.");
  
  if (!data.unit || typeof data.unit !== "string" || data.unit.trim().length === 0)
    errors.push("Unit is required and must be a non-empty string.");

  if (!data.expiryDate || isNaN(new Date(data.expiryDate).getTime()))
    errors.push("Valid expiry date is required.");
  
  if (!data.category || typeof data.category !== "string" || data.category.trim().length === 0)
    errors.push("Category is required and must be a non-empty string.");

  return errors;
};

// @desc    Get all food items for the logged-in user with pagination
export const getFoodItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return errorResponse(res, null, 'Invalid pagination parameters', 400);
    }
    
    const result = await foodService.getAllFoodItems(req.user._id, {
      page: pageNum,
      limit: limitNum,
      status,
      search
    });
    
    if (result.success) {
      return successResponse(res, result.data, 'Food items fetched successfully');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to fetch food items');
  }
};

// @desc    Get food history (consumed/expired items) with pagination
export const getFoodHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return errorResponse(res, null, 'Invalid pagination parameters', 400);
    }
    
    const result = await foodService.getFoodHistory(req.user._id, {
      page: pageNum,
      limit: limitNum,
      status,
      search
    });
    
    if (result.success) {
      return successResponse(res, result.data, 'Food history fetched successfully');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to fetch food history');
  }
};

// @desc    Add a new food item + call AI
export const addFoodItem = async (req, res) => {
  try {
    console.log('🔍 Add Food Item - Request Body:', req.body);
    console.log('🔍 Add Food Item - User ID:', req.user._id);

    // Whitelist allowed fields for add
    const allowedFields = [
      'name', 'description', 'quantity', 'unit', 'expiryDate', 'category', 'barcode',
      'predictedUsageRate', 'recommendedQty', 'likelyToExpire', 'daysUntilExpiry', 'ml_prediction',
      'price', 'notes', 'storageLocation'
    ];
    let addData = {};
    let errors = [];
    
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        // Convert quantity to number if it's a string
        if (key === 'quantity') {
          addData[key] = parseFloat(req.body[key]);
        } else if (key === 'price') {
          // Handle empty price string
          if (req.body[key] === '' || req.body[key] === null || req.body[key] === undefined) {
            addData[key] = 0;
          } else {
            addData[key] = parseFloat(req.body[key]);
          }
        } else if (key === 'expiryDate') {
          // Ensure expiry date is properly formatted
          const date = new Date(req.body[key]);
          if (isNaN(date.getTime())) {
            errors.push("Invalid expiry date format.");
          } else {
            addData[key] = date;
          }
        } else {
          addData[key] = req.body[key];
        }
      }
    }
    addData.userId = req.user._id;

    // Ensure addedAt is always set
    if (!addData.addedAt) {
      addData.addedAt = new Date();
    }
    console.log('🔍 Add Food Item - Processed Data:', addData);

    // Add validation errors
    const validationErrors = validateFoodInput(addData);
    errors = errors.concat(validationErrors);
    if (errors.length > 0) {
      console.log('🔍 Add Food Item - Validation Errors:', errors);
      return validationError(res, errors, 'Validation failed');
    }

    // Create the food item using service
    const result = await foodService.createFoodItem(addData, req.user._id);
    
    if (!result.success) {
      console.log('🔍 Add Food Item - Service Error:', result.error);
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }

    const savedItem = result.data;
    console.log('🔍 Add Food Item - Item Saved:', savedItem._id);

    // Create notifications for expiring soon and low stock
    const today = new Date();
    const expiryDate = new Date(savedItem.expiryDate);
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    const notificationsToCreate = [];
    if (diffDays <= 7 && diffDays >= 0) {
      notificationsToCreate.push({
        userId: savedItem.userId,
        type: 'expiry_warning',
        title: diffDays <= 1 ? '🚨 Urgent: Item Expiring Today!' : '⚠️ Item Expiring Soon',
        message: diffDays <= 1
          ? `${savedItem.name} will expire today. Use it quickly!`
          : `${savedItem.name} will expire within 7 days.`,
        priority: diffDays <= 1 ? 'high' : 'medium',
        items: [savedItem._id],
        itemNames: [savedItem.name],
        timestamp: today
      });
    }
    if (parseInt(savedItem.quantity) <= 2) {
      notificationsToCreate.push({
        userId: savedItem.userId,
        type: 'low_stock',
        title: '📦 Low Stock Alert',
        message: `${savedItem.name} is running low. Consider restocking.`,
        priority: 'medium',
        items: [savedItem._id],
        itemNames: [savedItem.name],
        timestamp: today
      });
    }
    for (const notif of notificationsToCreate) {
      await Notification.create(notif);
    }

    // 🔁 Call AI Python Flask API for predictions (optional)
    try {
      console.log('🔍 Add Food Item - Calling AI Model...');
      const aiResponse = await axios.post("http://127.0.0.1:5001/predict", {
        name: savedItem.name,
        quantity: savedItem.quantity,
        expiryDate: savedItem.expiryDate,
        category: savedItem.category,
      }, {
        timeout: 5000, // 5 second timeout
      });

      console.log('🔍 Add Food Item - AI Response:', aiResponse.data);

      // Update the item with AI predictions
      const updateResult = await foodService.updateFoodItem(savedItem._id, {
        predictedUsageRate: aiResponse.data.predictedUsageRate,
        recommendedQty: aiResponse.data.recommendedQty,
        likelyToExpire: aiResponse.data.likelyToExpire,
        daysUntilExpiry: aiResponse.data.daysUntilExpiry,
        ml_prediction: aiResponse.data.ml_prediction,
      }, req.user._id);

      if (updateResult.success) {
        console.log('🔍 Add Food Item - AI Update Success');
        // Create a notification for the new food item
        await Notification.create({
          userId: savedItem.userId,
          type: 'item_added',
          title: 'New Food Item Added',
          message: `You added '${savedItem.name}' to your inventory.`,
          priority: 'medium',
          items: [savedItem._id],
        });
        return successResponse(res, updateResult.data, 'Food item created with AI predictions', 201);
      } else {
        console.log('🔍 Add Food Item - AI Update Failed:', updateResult.error);
        return successResponse(res, savedItem, 'Food item created (AI update failed)', 201);
      }
    } catch (aiError) {
      console.log('🔍 Add Food Item - AI Error:', aiError.message);
      // Still return the saved item even if AI fails
      return successResponse(res, savedItem, 'Food item created (AI prediction failed)', 201);
    }
  } catch (error) {
    console.log('🔍 Add Food Item - General Error:', error.message);
    console.log('🔍 Add Food Item - Error Stack:', error.stack);
    return errorResponse(res, error, 'Failed to create food item');
  }
};

// @desc    Update a food item
export const updateFoodItem = async (req, res) => {
  try {
    // Whitelist allowed fields for update
    const allowedFields = [
      'name', 'quantity', 'unit', 'expiryDate', 'category', 'barcode',
      'predictedUsageRate', 'recommendedQty', 'likelyToExpire', 'daysUntilExpiry', 'ml_prediction',
      'description', 'price', 'notes', 'storageLocation', 'status'
    ];
    let updateData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    // Normalize category and unit to match allowed enum values
    const allowedCategories = [
      'Fruits', 'Vegetables', 'Dairy', 'Meat', 'Grains', 'Beverages', 'Snacks', 'Condiments', 'Frozen', 'Canned', 'Other',
      'fruits', 'vegetables', 'dairy', 'meat', 'grains', 'beverages', 'snacks', 'condiments', 'frozen', 'canned', 'other'
    ];
    const allowedUnits = [
      'units', 'kg', 'g', 'l', 'ml', 'pieces', 'packages', 'Kilograms', 'Grams', 'Liters', 'Milliliters', 'Pieces', 'Packages'
    ];
    
    if (updateData.category && !allowedCategories.includes(updateData.category)) {
      const found = allowedCategories.find(cat => cat.toLowerCase() === updateData.category.toLowerCase());
      if (found) updateData.category = found;
    }
    if (updateData.unit && !allowedUnits.includes(updateData.unit)) {
      const found = allowedUnits.find(u => u.toLowerCase() === updateData.unit.toLowerCase());
      if (found) updateData.unit = found;
    }

    const result = await foodService.updateFoodItem(req.params.id, updateData, req.user._id);
    
    if (result.success) {
      return successResponse(res, result.data, 'Food item updated successfully');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to update food item');
  }
};

// @desc    Delete a food item
export const deleteFoodItem = async (req, res) => {
  try {
    const result = await foodService.deleteFoodItem(req.params.id, req.user._id);
    
    if (result.success) {
      return successResponse(res, null, result.message);
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to delete food item');
  }
};

// @desc    Mark a food item as consumed
export const markAsConsumed = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const result = await foodService.updateFoodItem(id, { status: 'consumed' }, userId);
    if (result.success) {
      return successResponse(res, result.data, 'Food item marked as consumed');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to mark item as consumed');
  }
};

// @desc    Get AI predictions for all user's items
export const getAIPredictions = async (req, res) => {
  try {
    const result = await foodService.getAllFoodItems(req.user._id);
    
    if (!result.success) {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }

    const items = result.data;
    
    if (items.length === 0) {
      return successResponse(res, { predictions: [] }, 'No items to predict');
    }

    try {
      const aiResponse = await axios.post("http://127.0.0.1:5001/batch-predict", {
        items: items.map(item => ({
          _id: item._id,
          name: item.name,
          quantity: item.quantity,
          expiryDate: item.expiryDate,
          category: item.category,
        }))
      }, {
        timeout: 15000, // 15 second timeout for batch
      });

      return successResponse(res, aiResponse.data, 'AI predictions fetched successfully');
    } catch (aiError) {
      return errorResponse(res, aiError, 'Failed to get AI predictions');
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to get predictions');
  }
};

// @desc    Get expiring items
export const getExpiringItems = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = await foodService.getExpiringItems(req.user._id, days);
    
    if (result.success) {
      return successResponse(res, result.data, 'Expiring items fetched successfully');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to get expiring items');
  }
};

// @desc    Get food statistics
export const getFoodStats = async (req, res) => {
  try {
    const result = await foodService.getFoodStats(req.user._id);
    
    if (result.success) {
      return successResponse(res, result.data, 'Food statistics fetched successfully');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to get food statistics');
  }
};
