import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { type: String, default: "" },
  quantity: { 
    type: Number, 
    required: true,
    min: 0.1
  },
  unit: { 
    type: String, 
    required: true,
    default: 'pcs'
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Fruits', 'Vegetables', 'Dairy', 'Meat', 'Grains', 'Beverages', 'Snacks', 'Condiments', 'Frozen', 'Canned', 'Other',
      'fruits', 'vegetables', 'dairy', 'meat', 'grains', 'beverages', 'snacks', 'condiments', 'frozen', 'canned', 'other'
    ]
  },
  barcode: { type: String, default: "" },
  storageLocation: { type: String, default: "" },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // AI Prediction Fields
  predictedUsageRate: {
    type: Number,
    min: 0,
    max: 1
  },
  recommendedQty: {
    type: Number,
    min: 0
  },
  likelyToExpire: {
    type: Boolean,
    default: false
  },
  daysUntilExpiry: {
    type: Number
  },
  ml_prediction: {
    will_spoil: Boolean,
    confidence: Number
  },
  
  // Metadata
  addedAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  price: { 
    type: Number, 
    default: 0,
    min: 0
  },
  notes: { type: String, default: "" },
  status: { type: String, enum: ["active", "consumed", "expired"], default: "active" },
}, {
  timestamps: true
});

// Index for better query performance
foodItemSchema.index({ userId: 1, expiryDate: 1 });
foodItemSchema.index({ userId: 1, category: 1 });

// Virtual for days until expiry
foodItemSchema.virtual('daysUntilExpiryVirtual').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if item is expired
foodItemSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > new Date(this.expiryDate);
};

// Method to check if item is expiring soon
foodItemSchema.methods.isExpiringSoon = function(days = 7) {
  if (!this.expiryDate) return false;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
};

// Pre-save middleware to update daysUntilExpiry
foodItemSchema.pre('save', function(next) {
  if (this.expiryDate) {
    const today = new Date();
    const expiry = new Date(this.expiryDate);
    const diffTime = expiry - today;
    this.daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  this.updatedAt = new Date();
  next();
});

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
export default FoodItem;
