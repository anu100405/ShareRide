const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const { generateToken } = require('../services/token.service');
const { ROLES } = require('../config/constants');

// POST /api/auth/register/passenger
const registerPassenger = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or phone already in use' });
    }

    const user = await User.create({ name, email, phone, password, role: ROLES.PASSENGER });
    const token = generateToken(user._id, ROLES.PASSENGER);

    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register/driver
const registerDriver = async (req, res, next) => {
  try {
    const { name, email, phone, password, licenseNumber, vehicle } = req.body;

    const existing = await Driver.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or phone already in use' });
    }

    const driver = await Driver.create({
      name, email, phone, password, licenseNumber, vehicle, role: ROLES.DRIVER,
    });
    const token = generateToken(driver._id, ROLES.DRIVER);

    res.status(201).json({ success: true, token, user: driver.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login/passenger
const loginPassenger = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, ROLES.PASSENGER);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login/driver
const loginDriver = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const driver = await Driver.findOne({ email }).select('+password');
    if (!driver || !(await driver.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(driver._id, ROLES.DRIVER);
    res.json({ success: true, token, user: driver.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject(), role: req.userRole });
};

module.exports = { registerPassenger, registerDriver, loginPassenger, loginDriver, getMe };