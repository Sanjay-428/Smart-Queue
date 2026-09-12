const mongoose = require('mongoose');

const queueTokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
    },
    hospitalCode: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    queuePosition: {
      type: Number,
      required: true,
      default: 1,
    },
    estimatedWaitMinutes: {
      type: Number,
      required: true,
      default: 15,
    },
    status: {
      type: String,
      enum: ['Waiting', 'Serving', 'Completed', 'Cancelled'],
      default: 'Waiting',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QueueToken', queueTokenSchema);
