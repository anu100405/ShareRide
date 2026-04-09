const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { DRIVER_STATUS, VEHICLE_TYPES, ROLES } = require('../config/constants');

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: ROLES.DRIVER },
    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },

    licenseNumber: { type: String, required: true, unique: true },
    vehicle: {
      type: { type: String, enum: Object.values(VEHICLE_TYPES), required: true },
      model: { type: String, required: true },
      plateNumber: { type: String, required: true, unique: true },
      color: { type: String, required: true },
      capacity: { type: Number, default: 4 },
    },

    status: { type: String, enum: Object.values(DRIVER_STATUS), default: DRIVER_STATUS.OFFLINE },

    // GeoJSON location for geospatial queries
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    // Current active ride
    currentRide: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null },

    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });

driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

driverSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

driverSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Driver', driverSchema);