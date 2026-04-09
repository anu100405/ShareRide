const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../config/constants');
const {
  estimateFare,
  requestRide,
  getAvailableSharedRides,
  joinSharedRide,
  getRideById,
  cancelRide,
  rateRide,
  getNearbyDrivers,
} = require('../controllers/ride.controller');

// Public-ish (authenticated by any role)
router.post('/estimate', authenticate, estimateFare);
router.get('/nearby-drivers', authenticate, getNearbyDrivers);
router.get('/:rideId', authenticate, getRideById);

// Passenger only
router.post('/request', authenticate, authorize(ROLES.PASSENGER), requestRide);
router.get('/shared/available', authenticate, authorize(ROLES.PASSENGER), getAvailableSharedRides);
router.post('/:rideId/join', authenticate, authorize(ROLES.PASSENGER), joinSharedRide);
router.post('/:rideId/rate', authenticate, rateRide);
router.delete('/:rideId/cancel', authenticate, cancelRide);

module.exports = router;