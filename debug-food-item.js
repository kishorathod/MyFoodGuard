#!/usr/bin/env node

/**
 * Debug Script for Food Item Creation
 * Run this script to test the food item creation process
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testItem = {
  name: "Test Apple",
  description: "A test apple for debugging",
  category: "fruits",
  quantity: 1,
  unit: "units",
  expiryDate: "2024-01-15",
  price: "",
  storageLocation: "fridge",
  notes: "Test item for debugging"
};

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  try {
    const response = await fetch(`${API_BASE_URL}/food/test`);
    const data = await response.json();
    console.log('✅ Backend connection:', data);
    return true;
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return false;
  }
}

async function testDatabaseConnection(token) {
  console.log('🔍 Testing database connection...');
  try {
    const response = await fetch(`${API_BASE_URL}/food/test-db`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    console.log('✅ Database connection:', data);
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testFoodItemCreation(token) {
  console.log('🔍 Testing food item creation...');
  console.log('📦 Test data:', testItem);
  
  try {
    const response = await fetch(`${API_BASE_URL}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testItem)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📊 Response data:', data);
    
    if (response.ok) {
      console.log('✅ Food item created successfully');
      return data.data._id;
    } else {
      console.log('❌ Food item creation failed:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Food item creation error:', error.message);
    return null;
  }
}

async function testFoodItemDeletion(token, itemId) {
  if (!itemId) return;
  
  console.log('🔍 Testing food item deletion...');
  try {
    const response = await fetch(`${API_BASE_URL}/food/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('📊 Deletion response:', data);
    
    if (response.ok) {
      console.log('✅ Food item deleted successfully');
    } else {
      console.log('❌ Food item deletion failed:', data);
    }
  } catch (error) {
    console.log('❌ Food item deletion error:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting food item debugging...\n');
  
  // Test backend connection
  const backendOk = await testBackendConnection();
  if (!backendOk) {
    console.log('❌ Backend is not running. Please start the backend server.');
    return;
  }
  
  // Get token from command line or use a test token
  const token = process.argv[2];
  if (!token) {
    console.log('❌ Please provide a JWT token as the first argument.');
    console.log('Usage: node debug-food-item.js <JWT_TOKEN>');
    return;
  }
  
  console.log('🔑 Using token:', token.substring(0, 20) + '...');
  
  // Test database connection
  const dbOk = await testDatabaseConnection(token);
  if (!dbOk) {
    console.log('❌ Database connection failed. Check MongoDB and authentication.');
    return;
  }
  
  // Test food item creation
  const itemId = await testFoodItemCreation(token);
  
  // Clean up - delete test item
  if (itemId) {
    await testFoodItemDeletion(token, itemId);
  }
  
  console.log('\n🏁 Debugging complete!');
}

main().catch(console.error); 