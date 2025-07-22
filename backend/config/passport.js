import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { logInfo, logError } from '../utils/logger.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logInfo('Google OAuth callback', { 
      googleId: profile.id, 
      email: profile.emails[0]?.value,
      displayName: profile.displayName 
    });

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // Check if user exists by email (in case they registered with email/password first)
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Update existing user with Google ID
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value;
        user.lastLoginAt = new Date();
        await user.save();
        logInfo('Updated existing user with Google ID', { userId: user._id });
      } else {
        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value,
          lastLoginAt: new Date()
        });
        logInfo('Created new user via Google OAuth', { userId: user._id });
      }
    } else {
      // Update last login time
      user.lastLoginAt = new Date();
      user.avatar = profile.photos[0]?.value; // Update avatar in case it changed
      await user.save();
      logInfo('User logged in via Google OAuth', { userId: user._id });
    }

    return done(null, user);
  } catch (err) {
    logError('Google OAuth error', err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    logError('Passport deserialize error', err);
    done(err, null);
  }
});

export default passport; 