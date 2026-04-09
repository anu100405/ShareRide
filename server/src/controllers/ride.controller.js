const Ride = require('../models/ride.model');
const Driver = require('../models/driver.model');
const rideService = require('../services/ride.service');
const { calculateFare } = require('../services/fare.service');
const { RIDE_STATUS, RIDE_TYPE } = require('../config/constants');

// POST /api/rides/estimate
// Get fare estimate before booking
const estimateFare = async (req, res, next) => {
  try {
    const { pickup, dropoff, vehicleType, rideType = RIDE_TYPE.SOLO } = req.body;
    const fareInfo = calculateFare(vehicleType, pickup.coordinates, dropoff.coordinates, rideType);
    res.json({ success: true, fare: fareInfo });
  } catch (err) {
    next(err);
  }
};

// POST /api/rides/request
// HTTP fallback to request a ride (also possible via socket)
const requestRide = async (req, res, next) => {
  try {
    const { pickup, dropoff, vehicleType, rideType = RIDE_TYPE.SOLO } = req.body;
    const ride = await rideService.createRide({
      passengerId: req.user._id,
      pickup,
      dropoff,
      vehicleType,
      rideType,
    });
    res.status(201).json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides/shared/available
// List shared rides a passenger can join
const getAvailableSharedRides = async (req, res, next) => {
  try {
    const { vehicleType, lat, lng } = req.query;

    const query = {
      rideType: RIDE_TYPE.SHARED,
      status: { $in: [RIDE_STATUS.SEARCHING, RIDE_STATUS.ACCEPTED] },
      vehicleType,
    };

    const rides = await Ride.find(query)
      .populate('passenger', 'name rating')
      .populate('driver', 'name vehicle rating')
      .sort({ createdAt: -1 })
      .limit(20);

    // Filter rides that still have space
    const available = rides.filter((r) => {
      const current = r.sharedPassengers.length + 1;
      return current < r.maxPassengers;
    });

    res.json({ success: true, rides: available });
  } catch (err) {
    next(err);
  }
};

// POST /api/rides/:rideId/join
// Join an existing shared ride
const joinSharedRide = async (req, res, next) => {
  try {
    const { pickup, dropoff } = req.body;
    const ride = await rideService.joinSharedRide({
      rideId: req.params.rideId,
      passengerId: req.user._id,
      pickup,
      dropoff,
    });
    res.json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides/:rideId
// Get ride details
const getRideById = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate('passenger', 'name phone rating')
      .populate('driver', 'name phone vehicle rating currentLocation')
      .populate('sharedPassengers.passenger', 'name phone');

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    res.json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/rides/:rideId/cancel
const cancelRide = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const ride = await rideService.cancelRide(req.params.rideId, req.userRole, reason);
    res.json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// POST /api/rides/:rideId/rate
const rateRide = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const ride = await rideService.rateRide(
      req.params.rideId,
      req.user._id,
      req.userRole,
      rating,
      review
    );
    res.json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides/nearby-drivers
// Get nearby online drivers for map display
const getNearbyDrivers = async (req, res, next) => {
  try {
    const { lat, lng, vehicleType, radius = 5 } = req.query;
    const drivers = await rideService.findNearbyDrivers(
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      vehicleType,
      parseFloat(radius)
    );

    const safeDrivers = drivers.map((d) => ({
      id: d._id,
      name: d.name,
      vehicle: d.vehicle,
      rating: d.rating,
      location: d.currentLocation.coordinates, // [lng, lat]
    }));

    res.json({ success: true, drivers: safeDrivers });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  estimateFare,
  requestRide,
  getAvailableSharedRides,
  joinSharedRide,
  getRideById,
  cancelRide,
  rateRide,
  getNearbyDrivers,
};