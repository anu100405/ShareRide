const Driver = require('../models/driver.model');
const Ride = require('../models/ride.model');
const { DRIVER_STATUS } = require('../config/constants');

// GET /api/drivers/profile
const getProfile = async (req, res) => {
  res.json({ success: true, driver: req.user.toSafeObject() });
};

// PUT /api/drivers/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, vehicle } = req.body;
    const updated = await Driver.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar, ...(vehicle && { vehicle }) },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: updated.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// GET /api/drivers/rides
const getRideHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const rides = await Ride.find({ driver: req.user._id })
      .populate('passenger', 'name phone rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, rides, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

// GET /api/drivers/earnings
const getEarnings = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.user._id).select('totalEarnings totalRides rating');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRides = await Ride.find({
      driver: req.user._id,
      status: 'completed',
      completedAt: { $gte: todayStart },
    }).select('fare.actual');

    const todayEarnings = todayRides.reduce((sum, r) => sum + (r.fare?.actual || 0), 0);

    res.json({
      success: true,
      earnings: {
        total: driver.totalEarnings,
        today: todayEarnings,
        totalRides: driver.totalRides,
        rating: driver.rating,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/drivers/current-ride
const getCurrentRide = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.user._id).populate('currentRide');
    res.json({ success: true, currentRide: driver.currentRide || null });
  } catch (err) {
    next(err);
  }
};

// GET /api/drivers/status
const getStatus = async (req, res) => {
  res.json({ success: true, status: req.user.status });
};

module.exports = { getProfile, updateProfile, getRideHistory, getEarnings, getCurrentRide, getStatus };