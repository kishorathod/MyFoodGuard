import express from "express";
import {
  getFoodItems,
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getAIPredictions,
  getExpiringItems,
  testEndpoint,
  testDatabase,
  markAsConsumed,
  getFoodHistory
} from "../controllers/foodController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Test endpoints
router.get("/test", testEndpoint);
router.get("/test-db", protect, testDatabase);

// Basic CRUD operations
router.get("/", protect, getFoodItems);
router.post("/", protect, addFoodItem);
router.put("/:id", protect, updateFoodItem);
router.delete("/:id", protect, deleteFoodItem);
router.patch("/:id/consume", protect, markAsConsumed);

// AI and analytics endpoints
router.get("/predictions", protect, getAIPredictions);
router.get("/expiring", protect, getExpiringItems);

// History endpoint
router.get("/history", protect, getFoodHistory);

export default router;
