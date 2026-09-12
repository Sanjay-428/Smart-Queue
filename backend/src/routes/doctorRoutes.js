const express = require('express');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors or filter by department / search
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { department, search, hospitalId } = req.query;
    const query = {};

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }
    if (department && department !== 'All') {
      query.specialty = new RegExp(department, 'i');
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { specialty: regex },
        { hospitalName: regex },
        { title: regex }
      ];
    }

    const doctors = await Doctor.find(query).sort({ status: 1, name: 1 });
    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor list.',
    });
  }
});

/**
 * @route   GET /api/doctors/hospital/:hospitalId
 * @desc    Get doctors list for a specific hospital
 * @access  Public
 */
router.get('/hospital/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const doctors = await Doctor.find({ hospitalId }).sort({ specialty: 1, name: 1 });
    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error('Error fetching hospital doctors:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching hospital doctors.',
    });
  }
});

/**
 * @route   PUT /api/doctors/:id/status
 * @desc    Update doctor status (On Duty, In Consultation, On Break, Off Duty)
 * @access  Private (Staff/Admin)
 */
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['On Duty', 'In Consultation', 'On Break', 'Off Duty'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value.',
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Doctor ${doctor.name} status updated to ${status}`,
      data: doctor,
    });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating doctor status.',
    });
  }
});

/**
 * @route   POST /api/doctors
 * @desc    Add a new doctor profile
 * @access  Private (Staff/Admin)
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, title, specialty, hospitalId, roomNumber, experienceYears, shiftHours, availableDays } = req.body;

    if (!name || !specialty || !hospitalId || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, specialty, hospitalId, and roomNumber are required fields.',
      });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found.',
      });
    }

    const doctor = await Doctor.create({
      name,
      title: title || 'MD, Specialist',
      specialty,
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      roomNumber,
      experienceYears: experienceYears || 8,
      shiftHours: shiftHours || '09:00 AM - 05:00 PM',
      availableDays: availableDays || 'Mon - Fri',
      status: 'On Duty',
    });

    return res.status(201).json({
      success: true,
      message: `Doctor ${name} successfully added!`,
      data: doctor,
    });
  } catch (error) {
    console.error('Error adding doctor:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating doctor record.',
    });
  }
});

module.exports = router;
