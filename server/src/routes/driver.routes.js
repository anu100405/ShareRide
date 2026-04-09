const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../config/constants');
const {
  getProfile,
  updateProfile,
  getRideHistory,
  getEarnings,
  getCurrentRide,
  getStatus,
} = require('../controllers/driver.controller');

router.use(authenticate, authorize(ROLES.DRIVER));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/rides', getRideHistory);
router.get('/earnings', getEarnings);
router.get('/current-ride', getCurrentRide);
router.get('/status', getStatus);

module.exports = router;