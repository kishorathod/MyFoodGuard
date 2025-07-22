import FoodItem from "../models/FoodItem.js";
import { logError, logInfo } from "../utils/logger.js";
import { successResponse, errorResponse, notFoundError } from "../utils/responseHandler.js";

class FoodService {
  // Get all food items for a user with pagination
  async getAllFoodItems(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status = 'all', search = '' } = options;
      logInfo(`Fetching food items for user: ${userId}`, { page, limit, status, search });
      
      // Build query
      let query = { userId };
      
      // Add status filter
      if (status !== 'all') {
        if (status === 'active') {
          query.status = { $in: ['active', undefined] };
        } else {
          query.status = status;
        }
      }
      
      // Add search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute query with pagination
      const [items, total] = await Promise.all([
        FoodItem.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        FoodItem.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return { 
        success: true, 
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      logError('Error fetching food items', error, { userId, options });
      return { success: false, error: error.message };
    }
  }

  // Get food history (consumed/expired items) with pagination
  async getFoodHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status = 'all', search = '' } = options;
      logInfo(`Fetching food history for user: ${userId}`, { page, limit, status, search });
      
      // Build query for consumed/expired items
      let query = { 
        userId,
        $or: [
          { status: 'consumed' },
          { status: 'expired' },
          { expiryDate: { $lt: new Date() } } // Also include items past expiry date
        ]
      };
      
      // Add status filter
      if (status !== 'all') {
        if (status === 'consumed') {
          query = { userId, status: 'consumed' };
        } else if (status === 'expired') {
          query = { 
            userId,
            $or: [
              { status: 'expired' },
              { expiryDate: { $lt: new Date() } }
            ]
          };
        }
      }
      
      // Add search filter
      if (search) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
          ]
        });
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute query with pagination
      const [items, total] = await Promise.all([
        FoodItem.find(query)
          .sort({ updatedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        FoodItem.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return { 
        success: true, 
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      logError('Error fetching food history', error, { userId, options });
      return { success: false, error: error.message };
    }
  }

  // Get a single food item
  async getFoodItem(itemId, userId) {
    try {
      logInfo(`Fetching food item: ${itemId} for user: ${userId}`);
      const item = await FoodItem.findOne({ _id: itemId, userId });
      
      if (!item) {
        return { success: false, error: 'Food item not found', statusCode: 404 };
      }
      
      return { success: true, data: item };
    } catch (error) {
      logError('Error fetching food item', error, { itemId, userId });
      return { success: false, error: error.message };
    }
  }

  // Create a new food item
  async createFoodItem(itemData, userId) {
    try {
      logInfo(`Creating food item for user: ${userId}`, { itemName: itemData.name });
      
      const newItem = new FoodItem({
        ...itemData,
        userId,
        addedAt: itemData.addedAt || new Date(),
        createdAt: new Date()
      });
      
      const savedItem = await newItem.save();
      logInfo(`Food item created successfully: ${savedItem._id}`);
      
      return { success: true, data: savedItem };
    } catch (error) {
      logError('Error creating food item', error, { userId, itemData });
      return { success: false, error: error.message };
    }
  }

  // Update a food item
  async updateFoodItem(itemId, updateData, userId) {
    try {
      logInfo(`Updating food item: ${itemId} for user: ${userId}`);
      
      const item = await FoodItem.findOne({ _id: itemId, userId });
      
      if (!item) {
        return { success: false, error: 'Food item not found', statusCode: 404 };
      }
      
      const updatedItem = await FoodItem.findByIdAndUpdate(
        itemId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      logInfo(`Food item updated successfully: ${itemId}`);
      return { success: true, data: updatedItem };
    } catch (error) {
      logError('Error updating food item', error, { itemId, userId, updateData });
      return { success: false, error: error.message };
    }
  }

  // Delete a food item
  async deleteFoodItem(itemId, userId) {
    try {
      logInfo(`Deleting food item: ${itemId} for user: ${userId}`);
      
      const item = await FoodItem.findOne({ _id: itemId, userId });
      
      if (!item) {
        return { success: false, error: 'Food item not found', statusCode: 404 };
      }
      
      await FoodItem.findByIdAndDelete(itemId);
      logInfo(`Food item deleted successfully: ${itemId}`);
      
      return { success: true, message: 'Food item deleted successfully' };
    } catch (error) {
      logError('Error deleting food item', error, { itemId, userId });
      return { success: false, error: error.message };
    }
  }

  // Get expiring items
  async getExpiringItems(userId, days = 7) {
    try {
      logInfo(`Fetching expiring items for user: ${userId} within ${days} days`);
      
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const expiringItems = await FoodItem.find({
        userId,
        expiryDate: {
          $gte: today,
          $lte: futureDate
        }
      }).sort({ expiryDate: 1 });
      
      return { success: true, data: expiringItems };
    } catch (error) {
      logError('Error fetching expiring items', error, { userId, days });
      return { success: false, error: error.message };
    }
  }

  // Get expired items
  async getExpiredItems(userId) {
    try {
      logInfo(`Fetching expired items for user: ${userId}`);
      
      const today = new Date();
      const expiredItems = await FoodItem.find({
        userId,
        expiryDate: { $lt: today }
      }).sort({ expiryDate: -1 });
      
      return { success: true, data: expiredItems };
    } catch (error) {
      logError('Error fetching expired items', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Get food statistics
  async getFoodStats(userId) {
    try {
      logInfo(`Fetching food statistics for user: ${userId}`);
      
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 7);
      
      const [totalItems, expiringItems, expiredItems] = await Promise.all([
        FoodItem.countDocuments({ userId }),
        FoodItem.countDocuments({
          userId,
          expiryDate: { $gte: today, $lte: futureDate }
        }),
        FoodItem.countDocuments({
          userId,
          expiryDate: { $lt: today }
        })
      ]);
      
      const stats = {
        totalItems,
        expiringItems,
        expiredItems,
        healthyItems: totalItems - expiringItems - expiredItems
      };
      
      return { success: true, data: stats };
    } catch (error) {
      logError('Error fetching food statistics', error, { userId });
      return { success: false, error: error.message };
    }
  }
}

export default new FoodService(); 