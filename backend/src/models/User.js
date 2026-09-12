const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['patient', 'staff', 'admin'],
      default: 'patient',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
