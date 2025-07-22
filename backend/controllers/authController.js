import authService from "../services/authService.js";
import { successResponse, errorResponse, validationError } from "../utils/responseHandler.js";
import { validateRequest, userSchema, loginSchema } from "../utils/validation.js";
import User from '../models/User.js';

// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, household } = req.body;

    if (!name || !email || !password || !household) {
      return validationError(res, ['All fields are required'], 'Missing required fields');
    }

    const result = await authService.register({ name, email, password, household });
    
    if (result.success) {
      return successResponse(res, result.data, 'User registered successfully', 201);
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Registration failed');
  }
};

// @route POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return validationError(res, ['Email and password are required'], 'Missing credentials');
    }

    const result = await authService.login({ email, password });
    
    if (result.success) {
      return successResponse(res, result.data, 'Login successful');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Login failed');
  }
};

// @route GET /api/auth/profile
export const getUserProfile = async (req, res) => {
  try {
    const result = await authService.getUserProfile(req.user._id);
    
    if (result.success) {
      return successResponse(res, result.data, 'Profile fetched successfully');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to fetch profile');
  }
};

// @route PUT /api/auth/profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, avatar } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    // Check for email uniqueness if changed
    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== userId.toString()) {
      return res.status(400).json({ message: 'Email already in use.' });
    }
    const updated = await User.findByIdAndUpdate(
      userId,
      { name, email, avatar },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
      success: true,
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// @route POST /api/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshToken(req.user._id);
    
    if (result.success) {
      return successResponse(res, result.data, 'Token refreshed successfully');
    } else {
      return errorResponse(res, null, result.error, result.statusCode || 500);
    }
  } catch (error) {
    return errorResponse(res, error, 'Failed to refresh token');
  }
};
