# Google OAuth & Email Setup Guide

This guide will help you set up Google OAuth authentication and Gmail SMTP for automatic email reports.

## 🔧 Environment Variables Setup

Create or update your `.env` file in the backend directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/food-waste-tracker

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-gmail@gmail.com

# Optional: Development settings
NODE_ENV=development
PORT=5000
```

## 📋 Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Food Waste Tracker"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`
5. Add test users (your email) if in testing mode

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the following:
   - Name: "Food Waste Tracker Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5173` (if using Vite dev server)
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

## 📧 Gmail SMTP Setup

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

### Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Find "App passwords" (under 2-Step Verification)
3. Generate a new app password for "Mail"
4. Use this password as your `SMTP_PASS` in the `.env` file

### Step 3: Test Email Configuration

The system will automatically test the email configuration when you start the server.

## 🚀 Starting the Application

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🔄 How It Works

### Google OAuth Flow

1. **User clicks "Continue with Google"** on the login page
2. **Redirect to Google** - User is redirected to Google's OAuth consent screen
3. **Google authentication** - User authenticates with Google
4. **Callback to backend** - Google redirects back to your backend with auth code
5. **User creation/login** - Backend creates or finds the user in the database
6. **Automatic email** - Backend sends a personalized report to the user's email
7. **Redirect to frontend** - User is redirected to the dashboard with JWT token

### Email Reports

- **New users**: Receive a welcome email with getting started guide
- **Returning users**: Receive a personalized waste report
- **Automatic sending**: No manual intervention required
- **Gmail SMTP**: Uses your Gmail account with app password

### Token Management

- **30-day tokens**: Extended token expiry for better user experience
- **Automatic refresh**: Tokens are refreshed automatically every 5 minutes
- **Persistent login**: Users stay logged in across browser sessions
- **Secure storage**: Tokens stored in localStorage with automatic cleanup

## 🛡️ Security Features

### OAuth Security
- **One-time consent**: Users only need to approve Google access once
- **Minimal scopes**: Only requests `email` and `profile` scopes
- **Secure redirects**: Validates redirect URIs
- **JWT tokens**: Secure token-based authentication

### Email Security
- **App passwords**: Uses Gmail app passwords instead of account passwords
- **SMTP over TLS**: Encrypted email transmission
- **Rate limiting**: Built-in email rate limiting to prevent abuse

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check that your redirect URI matches exactly in Google Console
   - Ensure the URI is added to authorized redirect URIs

2. **"SMTP authentication failed"**
   - Verify your Gmail app password is correct
   - Ensure 2-Factor Authentication is enabled
   - Check that SMTP_USER matches your Gmail address

3. **"Token refresh failed"**
   - Check JWT_SECRET is set correctly
   - Verify token expiry settings
   - Check network connectivity

4. **"Email not sending"**
   - Verify SMTP settings in `.env`
   - Check Gmail app password is correct
   - Ensure SMTP_FROM matches SMTP_USER

### Debug Mode

To enable debug logging, add to your `.env`:

```env
NODE_ENV=development
DEBUG=passport:*
```

## 📱 Testing the Flow

1. **Start both servers** (backend and frontend)
2. **Navigate to login page** (`http://localhost:3000/login`)
3. **Click "Continue with Google"**
4. **Complete Google authentication**
5. **Check your email** for the automatic report
6. **Verify dashboard access** with persistent login

## 🔄 Production Deployment

### Environment Variables for Production

```env
# Production settings
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
MONGODB_URI=your-production-mongodb-uri

# Update Google OAuth redirect URIs
# Add: https://yourdomain.com/api/auth/google/callback
```

### Google OAuth Production Setup

1. **Update OAuth consent screen** to "In production"
2. **Add production domain** to authorized origins
3. **Update redirect URIs** with your production domain
4. **Remove test users** (no longer needed in production)

### Email Configuration

- **Use production Gmail account** or dedicated email service
- **Set up proper SPF/DKIM** for better email deliverability
- **Monitor email sending limits** (Gmail: 500/day for regular accounts)

## 📊 Monitoring

### Logs to Monitor

- **OAuth callbacks**: Check for successful/failed authentications
- **Email sending**: Monitor email delivery success rates
- **Token refresh**: Watch for token refresh failures
- **User creation**: Track new user registrations

### Key Metrics

- **Login success rate**: Should be >95%
- **Email delivery rate**: Should be >90%
- **Token refresh success**: Should be >99%
- **User retention**: Track returning users

## 🔐 Security Best Practices

1. **Rotate JWT secrets** regularly
2. **Monitor OAuth consent screen** for suspicious activity
3. **Use environment variables** for all secrets
4. **Implement rate limiting** on auth endpoints
5. **Monitor failed login attempts**
6. **Regular security audits** of OAuth configuration

## 📞 Support

If you encounter issues:

1. **Check the logs** in the backend console
2. **Verify environment variables** are set correctly
3. **Test email configuration** separately
4. **Check Google OAuth console** for any errors
5. **Review network connectivity** and firewall settings

---

**Note**: This setup provides a production-ready Google OAuth integration with automatic email reports. The system is designed to be reliable and require zero manual intervention after initial setup. 