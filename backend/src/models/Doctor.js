const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: 'MD, Senior Specialist',
    },
    specialty: {
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
    roomNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['On Duty', 'In Consultation', 'On Break', 'Off Duty'],
      default: 'On Duty',
    },
    experienceYears: {
      type: Number,
      default: 10,
    },
    availableDays: {
      type: String,
      default: 'Mon - Fri',
    },
    shiftHours: {
      type: String,
      default: '09:00 AM - 05:00 PM',
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
