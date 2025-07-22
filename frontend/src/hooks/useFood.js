import { useState, useEffect, useCallback } from 'react';
import foodService from '../services/foodService.js';
import { logInfo, logError } from '../utils/logger.js';

export const useFood = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [expiringItems, setExpiringItems] = useState([]);

  // Fetch all food items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      logInfo('Fetching food items');
      
      const result = await foodService.getAllFoodItems();
      
      if (result.success) {
        setItems(result.data);
        logInfo('Food items fetched successfully', { count: result.data.length });
      } else {
        setError(result.error);
        logError('Failed to fetch food items', null, { error: result.error });
      }
    } catch (error) {
      setError(error.message);
      logError('Fetch food items error', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new food item
  const createItem = useCallback(async (itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      logInfo('Creating food item', { name: itemData.name });
      
      const result = await foodService.createFoodItem(itemData);
      
      if (result.success) {
        setItems(prev => [result.data, ...prev]);
        logInfo('Food item created successfully', { itemId: result.data._id });
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        logError('Failed to create food item', null, { error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      logError('Create food item error', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a food item
  const updateItem = useCallback(async (itemId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      logInfo('Updating food item', { itemId });
      
      const result = await foodService.updateFoodItem(itemId, updateData);
      
      if (result.success) {
        setItems(prev => prev.map(item => 
          item._id === itemId ? result.data : item
        ));
        logInfo('Food item updated successfully', { itemId });
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        logError('Failed to update food item', null, { error: result.error, itemId });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      logError('Update food item error', error, { itemId });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a food item
  const deleteItem = useCallback(async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      
      logInfo('Deleting food item', { itemId });
      
      const result = await foodService.deleteFoodItem(itemId);
      
      if (result.success) {
        setItems(prev => prev.filter(item => item._id !== itemId));
        logInfo('Food item deleted successfully', { itemId });
        return { success: true, message: result.message };
      } else {
        setError(result.error);
        logError('Failed to delete food item', null, { error: result.error, itemId });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      logError('Delete food item error', error, { itemId });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark a food item as consumed
  const markAsConsumed = useCallback(async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await foodService.markAsConsumed(itemId);
      if (result.success) {
        setItems(prev => prev.filter(item => item._id !== itemId));
        logInfo('Food item marked as consumed', { itemId });
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        logError('Failed to mark as consumed', null, { error: result.error, itemId });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      logError('Mark as consumed error', error, { itemId });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch expiring items
  const fetchExpiringItems = useCallback(async (days = 7) => {
    try {
      logInfo('Fetching expiring items', { days });
      
      const result = await foodService.getExpiringItems(days);
      
      if (result.success) {
        setExpiringItems(result.data);
        logInfo('Expiring items fetched successfully', { count: result.data.length, days });
      } else {
        logError('Failed to fetch expiring items', null, { error: result.error });
      }
    } catch (error) {
      logError('Fetch expiring items error', error);
    }
  }, []);

  // Fetch food statistics
  const fetchStats = useCallback(async () => {
    try {
      logInfo('Fetching food statistics');
      
      const result = await foodService.getFoodStats();
      
      if (result.success) {
        setStats(result.data);
        logInfo('Food statistics fetched successfully', result.data);
      } else {
        logError('Failed to fetch food statistics', null, { error: result.error });
      }
    } catch (error) {
      logError('Fetch food statistics error', error);
    }
  }, []);

  // Get AI predictions
  const getAIPredictions = useCallback(async () => {
    try {
      logInfo('Fetching AI predictions');
      
      const result = await foodService.getAIPredictions();
      
      if (result.success) {
        logInfo('AI predictions fetched successfully', { count: result.data.predictions?.length || 0 });
        return { success: true, data: result.data };
      } else {
        logError('Failed to fetch AI predictions', null, { error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      logError('Get AI predictions error', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get expiring items for smart recipes
  const getExpiringItemsForRecipes = useCallback(() => {
    const today = new Date();
    return items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    });
  }, [items]);

  // Calculate statistics based on real data
  const calculateStats = useCallback(() => {
    const today = new Date();
    const expiredItems = items.filter(item => new Date(item.expiryDate) < today);
    const expiringSoon = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    });

    // Calculate money saved based on actual items
    const totalValue = items.reduce((sum, item) => {
      return sum + (item.price || 0);
    }, 0);

    const wastedValue = expiredItems.reduce((sum, item) => {
      return sum + (item.price || 0);
    }, 0);

    const savedValue = totalValue - wastedValue;

    return {
      totalItems: items.length,
      expiredItems: expiredItems.length,
      expiringSoon: expiringSoon.length,
      totalValue,
      wastedValue,
      savedValue,
      wastePercentage: totalValue > 0 ? (wastedValue / totalValue) * 100 : 0
    };
  }, [items]);

  // Initialize data on mount
  useEffect(() => {
    fetchItems();
    fetchStats();
    fetchExpiringItems();
  }, [fetchItems, fetchStats, fetchExpiringItems]);

  return {
    items,
    loading,
    error,
    stats,
    expiringItems,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    fetchExpiringItems,
    fetchStats,
    getAIPredictions,
    getExpiringItemsForRecipes,
    calculateStats,
    markAsConsumed,
  };
}; 