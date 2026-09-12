const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const QueueToken = require('../models/QueueToken');
const Hospital = require('../models/Hospital');

const router = express.Router();

/**
 * @route   POST /api/queue/join
 * @desc    Enroll patient in virtual queue for hospital & department
 * @access  Private (JWT Auth)
 */
router.post('/join', verifyToken, async (req, res) => {
  try {
    const { hospitalId, department } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!hospitalId || !department) {
      return res.status(400).json({
        success: false,
        message: 'Hospital ID and department selection are required.',
      });
    }

    // Check if user already has an active queue ticket
    const existingActive = await QueueToken.findOne({
      userId,
      status: { $in: ['Waiting', 'Serving'] },
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `You already have an active token (${existingActive.tokenNumber}) for ${existingActive.hospitalName}. Please cancel or complete your current token before joining a new queue.`,
        data: existingActive,
      });
    }

    // Find target hospital
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Selected hospital facility not found.',
      });
    }

    // Increment hospital queue length
    hospital.currentQueueLength += 1;
    await hospital.save();

    // Generate unique token number format (e.g. MGH-CAR-105)
    const deptPrefix = department.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const tokenNumber = `${hospital.code}-${deptPrefix}-${randomSeq}`;

    // Queue position & estimated wait calculation
    const queuePosition = hospital.currentQueueLength;
    const avgWaitPerPatient = hospital.avgWaitTimeMinutes > 0 ? Math.round(hospital.avgWaitTimeMinutes / Math.max(1, queuePosition - 1 || 1)) : 8;
    const estimatedWaitMinutes = Math.max(5, queuePosition * Math.max(4, avgWaitPerPatient));

    const newToken = await QueueToken.create({
      tokenNumber,
      userId,
      username,
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      hospitalCode: hospital.code,
      department,
      queuePosition,
      estimatedWaitMinutes,
      status: 'Waiting',
    });

    return res.status(201).json({
      success: true,
      message: `Queue token ${tokenNumber} successfully issued!`,
      data: newToken,
    });
  } catch (error) {
    console.error('Error joining queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating virtual queue token.',
    });
  }
});

/**
 * @route   GET /api/queue/active
 * @desc    Get active token for logged in user
 * @access  Private (JWT Auth)
 */
router.get('/active', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const activeToken = await QueueToken.findOne({
      userId,
      status: { $in: ['Waiting', 'Serving'] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: activeToken || null,
    });
  } catch (error) {
    console.error('Error fetching active queue token:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching active token status.',
    });
  }
});

/**
 * @route   POST /api/queue/cancel/:id
 * @desc    Cancel active token
 * @access  Private (JWT Auth)
 */
router.post('/cancel/:id', verifyToken, async (req, res) => {
  try {
    const tokenId = req.params.id;
    const userId = req.user.id;

    const token = await QueueToken.findOne({ _id: tokenId, userId });
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Active token not found or not owned by user.',
      });
    }

    if (token.status === 'Cancelled' || token.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: `Token is already ${token.status.toLowerCase()}.`,
      });
    }

    token.status = 'Cancelled';
    await token.save();

    // Decrement queue count on hospital
    const hospital = await Hospital.findById(token.hospitalId);
    if (hospital && hospital.currentQueueLength > 0) {
      hospital.currentQueueLength = Math.max(0, hospital.currentQueueLength - 1);
      await hospital.save();
    }

    return res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} has been successfully cancelled.`,
    });
  } catch (error) {
    console.error('Error cancelling queue token:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while cancelling queue token.',
    });
  }
});

/**
 * @route   GET /api/queue/history
 * @desc    Get queue history for logged in user (all past tokens)
 * @access  Private (JWT Auth)
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tokens = await QueueToken.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error) {
    console.error('Error fetching queue history:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user queue history.',
    });
  }
});

/**
 * @route   GET /api/queue/hospital/:hospitalId
 * @desc    Get all active & recent queue tokens for a hospital (for Staff Dashboard)
 * @access  Private (Staff/Admin)
 */
router.get('/hospital/:hospitalId', verifyToken, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const tokens = await QueueToken.find({ hospitalId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    console.error('Error fetching hospital queue tokens:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching hospital queue list.',
    });
  }
});

/**
 * @route   PUT /api/queue/status/:id
 * @desc    Update queue token status (Waiting -> Serving -> Completed / Cancelled)
 * @access  Private (Staff/Admin)
 */
router.put('/status/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Waiting', 'Serving', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token status value.',
      });
    }

    const token = await QueueToken.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Queue token not found.',
      });
    }

    const oldStatus = token.status;
    token.status = status;
    await token.save();

    // Adjust hospital queue length if completed or cancelled
    if ((status === 'Completed' || status === 'Cancelled') && (oldStatus === 'Waiting' || oldStatus === 'Serving')) {
      const hospital = await Hospital.findById(token.hospitalId);
      if (hospital && hospital.currentQueueLength > 0) {
        hospital.currentQueueLength = Math.max(0, hospital.currentQueueLength - 1);
        await hospital.save();
      }

      // Re-calculate remaining waiting tokens queue positions for this hospital
      const waitingTokens = await QueueToken.find({
        hospitalId: token.hospitalId,
        status: 'Waiting',
      }).sort({ createdAt: 1 });

      let pos = 1;
      for (const t of waitingTokens) {
        t.queuePosition = pos;
        t.estimatedWaitMinutes = Math.max(2, pos * 5);
        await t.save();
        pos++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} updated to ${status}.`,
      data: token,
    });
  } catch (error) {
    console.error('Error updating queue token status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating queue status.',
    });
  }
});

module.exports = router;
