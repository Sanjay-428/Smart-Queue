const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      default: 'Tamil Nadu',
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
      default: 'Downtown',
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: '+1 (555) 019-2834',
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    emergencyServices: {
      type: Boolean,
      default: true,
    },
    departments: [
      {
        type: String,
      },
    ],
    currentQueueLength: {
      type: Number,
      default: 5,
    },
    avgWaitTimeMinutes: {
      type: Number,
      default: 15,
    },
    crowdStatus: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Critical'],
      default: 'Moderate',
    },
    coordinates: {
      lat: { type: Number, default: 40.7128 },
      lng: { type: Number, default: -74.006 },
    },
    operatingHours: {
      type: String,
      default: '24/7 Open',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
