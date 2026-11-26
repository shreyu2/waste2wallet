import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['CITIZEN', 'COLLECTOR', 'ADMIN'], default: 'CITIZEN' },
    
    // Auth specific fields
    qrCode: { type: String },
    
    // Citizen specific stats
    points: { type: Number, default: 0 },
    carbonSavedKg: { type: Number, default: 0 },
    streakWeeks: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
      timestamp: { type: Date },
      updatedAt: { type: Date }
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
