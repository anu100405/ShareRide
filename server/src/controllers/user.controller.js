const User = require('../models/user.model');
const Ride = require('../models/ride.model');

// GET /api/users/profile
const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: updated.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/rides
const getRideHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const rides = await Ride.find({
      $or: [
        { passenger: req.user._id },
        { 'sharedPassengers.passenger': req.user._id },
      ],
    })
      .populate('driver', 'name phone vehicle rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, rides, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/saved-addresses
const addSavedAddress = async (req, res, next) => {
  try {
    const { label, address, coordinates } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { savedAddresses: { label, address, coordinates } } },
      { new: true }
    );
    res.json({ success: true, savedAddresses: user.savedAddresses });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/saved-addresses/:addressId
const deleteSavedAddress = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedAddresses: { _id: req.params.addressId } } },
      { new: true }
    );
    res.json({ success: true, savedAddresses: user.savedAddresses });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getRideHistory, addSavedAddress, deleteSavedAddress };