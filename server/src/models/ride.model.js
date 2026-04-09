const mongoose = require('mongoose');
const { RIDE_STATUS, RIDE_TYPE, VEHICLE_TYPES } = require('../config/constants');

const passengerSlotSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickup: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
  },
  dropoff: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
  },
  fare: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['waiting', 'picked_up', 'dropped_off', 'cancelled'],
    default: 'waiting',
  },
  pickedUpAt: Date,
  droppedOffAt: Date,
});

const rideSchema = new mongoose.Schema(
  {
    rideType: { type: String, enum: Object.values(RIDE_TYPE), required: true },
    vehicleType: { type: String, enum: Object.values(VEHICLE_TYPES), required: true },

    // For solo rides: use pickup/dropoff directly
    // For shared rides: each passenger has their own slot
    pickup: {
      address: String,
      coordinates: { lat: Number, lng: Number },
    },
    dropoff: {
      address: String,
      coordinates: { lat: Number, lng: Number },
    },

    // Primary passenger (ride requester / ride creator for shared)
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Additional passengers (shared rides only)
    sharedPassengers: [passengerSlotSchema],

    // Max passengers allowed (shared rides)
    maxPassengers: { type: Number, default: 1 },

    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },

    status: { type: String, enum: Object.values(RIDE_STATUS), default: RIDE_STATUS.REQUESTED },

    fare: {
      estimated: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
      perKm: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },

    distance: { type: Number, default: 0 }, // in km

    otp: { type: String }, // OTP to start the ride

    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ['passenger', 'driver', 'system'] },
    cancelReason: String,

    // Ratings after ride
    passengerRating: { type: Number, min: 1, max: 5 },
    driverRating: { type: Number, min: 1, max: 5 },
    passengerReview: String,
    driverReview: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);