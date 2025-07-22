import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logError, logInfo } from "../utils/logger.js";

class AuthService {
  // Register a new user
  async register(userData) {
    try {
      logInfo(`Registering new user: ${userData.email}`);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return { success: false, error: 'User already exists', statusCode: 400 };
      }
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // Create new user
      const newUser = new User({
        ...userData,
        password: hashedPassword,
        createdAt: new Date()
      });
      
      const savedUser = await newUser.save();
      logInfo(`User registered successfully: ${savedUser._id}`);
      
      // Generate JWT token
      const token = this.generateToken(savedUser._id);
      
      return { 
        success: true, 
        data: {
          user: {
            id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email
          },
          token
        }
      };
    } catch (error) {
      logError('Error registering user', error, { email: userData.email });
      return { success: false, error: error.message };
    }
  }

  // Login user
  async login(credentials) {
    try {
      logInfo(`User login attempt: ${credentials.email}`);
      
      // Find user by email
      const user = await User.findOne({ email: credentials.email });
      if (!user) {
        return { success: false, error: 'Invalid credentials', statusCode: 401 };
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid credentials', statusCode: 401 };
      }
      
      // Generate JWT token
      const token = this.generateToken(user._id);
      
      logInfo(`User logged in successfully: ${user._id}`);
      
      return { 
        success: true, 
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          },
          token
        }
      };
    } catch (error) {
      logError('Error during login', error, { email: credentials.email });
      return { success: false, error: error.message };
    }
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      if (!token) {
        return { success: false, error: 'No token provided', statusCode: 401 };
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        return { success: false, error: 'User not found', statusCode: 401 };
      }
      
      return { success: true, data: { userId: user._id, user } };
    } catch (error) {
      logError('Token verification failed', error);
      return { success: false, error: 'Invalid token', statusCode: 401 };
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      logInfo(`Fetching user profile: ${userId}`);
      
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return { success: false, error: 'User not found', statusCode: 404 };
      }
      
      return { success: true, data: user };
    } catch (error) {
      logError('Error fetching user profile', error, { userId });
      return { success: false, error: error.message };
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      logInfo(`Updating user profile: ${userId}`);
      
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found', statusCode: 404 };
      }
      
      // Hash password if it's being updated
      if (updateData.password) {
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');
      
      logInfo(`User profile updated successfully: ${userId}`);
      return { success: true, data: updatedUser };
    } catch (error) {
      logError('Error updating user profile', error, { userId, updateData });
      return { success: false, error: error.message };
    }
  }

  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  }

  // Refresh token
  async refreshToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found', statusCode: 401 };
      }
      
      const newToken = this.generateToken(userId);
      return { success: true, data: { token: newToken } };
    } catch (error) {
      logError('Error refreshing token', error, { userId });
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService(); 