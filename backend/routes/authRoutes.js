import express from "express";
import { registerUser, loginUser, updateUserProfile } from "../controllers/authController.js";
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import reportService from '../services/reportService.js';
import { logInfo, logError } from '../utils/logger.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Google OAuth login
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  accessType: 'offline', // This allows us to get refresh tokens
  prompt: 'consent' // This ensures we get a refresh token on first login
}));

// Google OAuth callback with automatic email sending
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }), 
  async (req, res) => {
    console.log("[OAuth Callback] req.user:", req.user);
    try {
      if (!req.user) {
        logError('Google OAuth callback failed - no user', {});
        console.log("[OAuth Callback] No user found, redirecting to /login");
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
      }

      // Generate JWT token with extended expiry for better persistence
      const token = jwt.sign(
        { 
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name
        }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '30d' } // Extended token expiry
      );

      // Check if this is a new user (first time login)
      const isNewUser = req.user.createdAt && 
        (new Date() - new Date(req.user.createdAt)) < (24 * 60 * 60 * 1000); // Within 24 hours

      // Send appropriate email report
      try {
        if (isNewUser) {
          logInfo('Sending welcome report for new Google user', { userId: req.user._id, email: req.user.email });
          await reportService.sendWelcomeReport(req.user._id);
        } else {
          logInfo('Sending automatic report for returning Google user', { userId: req.user._id, email: req.user.email });
          await reportService.sendAutomaticReport(req.user._id);
        }
      } catch (emailError) {
        logError('Failed to send email report after Google login', emailError, { userId: req.user._id });
        // Don't fail the login if email fails
      }

      // Redirect to frontend with token
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      }))}`;
      console.log("[OAuth Callback] Redirecting to:", redirectUrl);

      logInfo('Google OAuth login successful', { 
        userId: req.user._id, 
        email: req.user.email,
        isNewUser 
      });

      res.redirect(redirectUrl);
    } catch (error) {
      logError('Google OAuth callback error', error);
      console.log("[OAuth Callback] Error occurred:", error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
    }
  }
);

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Generate new token with extended expiry
    const newToken = jwt.sign(
      { 
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name
      }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    logError('Token refresh error', error);
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // For JWT, we don't need to do anything server-side
  // The client should remove the token from storage
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/profile', protect, async (req, res) => {
  try {
    // req.user is set by the protect middleware
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// Add profile update route
router.put("/profile", protect, updateUserProfile);

export default router;
