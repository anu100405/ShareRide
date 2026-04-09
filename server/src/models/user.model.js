const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.PASSENGER },
    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },

    // Passenger specific
    savedAddresses: [
      {
        label: String,    // home, work, etc.
        address: String,
        coordinates: { lat: Number, lng: Number },
      },
    ],
    rideHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ride' }],

    // Rating (for passengers, given by drivers)
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);