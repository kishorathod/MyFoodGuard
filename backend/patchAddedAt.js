// Patch script to ensure all FoodItems have createdAt, price, and quantity fields
import mongoose from 'mongoose';
import FoodItem from './models/FoodItem.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/foodguard';

async function patchFoodItems() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const items = await FoodItem.find({});
  let updatedCount = 0;

  for (const item of items) {
    let needsUpdate = false;
    if (!item.createdAt) {
      item.createdAt = item.addedAt || new Date();
      needsUpdate = true;
    }
    if (item.price === undefined || item.price === null) {
      item.price = 0;
      needsUpdate = true;
    }
    if (item.quantity === undefined || item.quantity === null) {
      item.quantity = 1;
      needsUpdate = true;
    }
    if (needsUpdate) {
      await item.save();
      updatedCount++;
    }
  }
  console.log(`Patched ${updatedCount} food items.`);
  await mongoose.disconnect();
}

patchFoodItems().catch(err => {
  console.error('Patch script error:', err);
  process.exit(1);
}); 