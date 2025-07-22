import apiService from './api.js';
import { logInfo, logError, logSuccess } from '../utils/logger.js';

class FoodService {
  // Get all food items
  async getAllFoodItems() {
    try {
      logInfo('Fetching all food items');
      
      const response = await apiService.get('/food');
      
      if (response.success) {
        logSuccess('Food items fetched successfully', { count: response.data.length });
        return { success: true, data: response.data };
      } else {
        logError('Failed to fetch food items', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Get food items error', error);
      return { success: false, error: error.message };
    }
  }

  // Get a single food item
  async getFoodItem(itemId) {
    try {
      logInfo('Fetching food item', { itemId });
      
      const response = await apiService.get(`/food/${itemId}`);
      
      if (response.success) {
        logSuccess('Food item fetched successfully', { itemId });
        return { success: true, data: response.data };
      } else {
        logError('Failed to fetch food item', null, { error: response.message, itemId });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Get food item error', error, { itemId });
      return { success: false, error: error.message };
    }
  }

  // Create a new food item
  async createFoodItem(itemData) {
    try {
      logInfo('Creating food item', { name: itemData.name });
      
      const response = await apiService.post('/food', itemData);
      
      if (response.success) {
        logSuccess('Food item created successfully', { itemId: response.data._id });
        return { success: true, data: response.data };
      } else {
        logError('Failed to create food item', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Create food item error', error);
      return { success: false, error: error.message };
    }
  }

  // Update a food item
  async updateFoodItem(itemId, updateData) {
    try {
      logInfo('Updating food item', { itemId });
      
      const response = await apiService.put(`/food/${itemId}`, updateData);
      
      if (response.success) {
        logSuccess('Food item updated successfully', { itemId });
        return { success: true, data: response.data };
      } else {
        logError('Failed to update food item', null, { error: response.message, itemId });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Update food item error', error, { itemId });
      return { success: false, error: error.message };
    }
  }

  // Delete a food item
  async deleteFoodItem(itemId) {
    try {
      logInfo('Deleting food item', { itemId });
      
      const response = await apiService.delete(`/food/${itemId}`);
      
      if (response.success) {
        logSuccess('Food item deleted successfully', { itemId });
        return { success: true, message: response.message };
      } else {
        logError('Failed to delete food item', null, { error: response.message, itemId });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Delete food item error', error, { itemId });
      return { success: false, error: error.message };
    }
  }

  // Get expiring items
  async getExpiringItems(days = 7) {
    try {
      logInfo('Fetching expiring items', { days });
      
      const response = await apiService.get(`/food/expiring?days=${days}`);
      
      if (response.success) {
        logSuccess('Expiring items fetched successfully', { count: response.data.length, days });
        return { success: true, data: response.data };
      } else {
        logError('Failed to fetch expiring items', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Get expiring items error', error);
      return { success: false, error: error.message };
    }
  }

  // Get food statistics
  async getFoodStats() {
    try {
      logInfo('Fetching food statistics');
      
      const response = await apiService.get('/food/stats');
      
      if (response.success) {
        logSuccess('Food statistics fetched successfully', response.data);
        return { success: true, data: response.data };
      } else {
        logError('Failed to fetch food statistics', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Get food statistics error', error);
      return { success: false, error: error.message };
    }
  }

  // Get AI predictions
  async getAIPredictions() {
    try {
      logInfo('Fetching AI predictions');
      
      const response = await apiService.get('/food/ai-predictions');
      
      if (response.success) {
        logSuccess('AI predictions fetched successfully', { count: response.data.predictions?.length || 0 });
        return { success: true, data: response.data };
      } else {
        logError('Failed to fetch AI predictions', null, { error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Get AI predictions error', error);
      return { success: false, error: error.message };
    }
  }

  // Mark a food item as consumed
  async markAsConsumed(itemId) {
    try {
      logInfo('Marking food item as consumed', { itemId });
      const response = await apiService.patch(`/food/${itemId}/consume`);
      if (response.success) {
        logSuccess('Food item marked as consumed', { itemId });
        return { success: true, data: response.data };
      } else {
        logError('Failed to mark as consumed', null, { error: response.message, itemId });
        return { success: false, error: response.message };
      }
    } catch (error) {
      logError('Mark as consumed error', error, { itemId });
      return { success: false, error: error.message };
    }
  }
}

export default new FoodService(); 