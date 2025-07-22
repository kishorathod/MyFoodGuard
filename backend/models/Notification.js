import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String },
  message: { type: String, required: true },
  priority: { type: String, default: 'medium' },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }],
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', NotificationSchema); 