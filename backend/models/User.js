import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId; } }, // Only required if not Google user
  googleId: { type: String, unique: true, sparse: true }, // For Google OAuth users
  avatar: { type: String }, // For Google profile picture
  household: {
    members: { type: Number, default: 1 },
    preferences: [String], // e.g., ["vegetarian", "gluten-free"]
  },
  lastLoginAt: { type: Date, default: Date.now },
  emailReportsEnabled: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

const User = mongoose.model("User", userSchema);
export default User;
