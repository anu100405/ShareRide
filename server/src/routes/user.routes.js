const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../config/constants');
const {
  getProfile,
  updateProfile,
  getRideHistory,
  addSavedAddress,
  deleteSavedAddress,
} = require('../controllers/user.controller');

router.use(authenticate, authorize(ROLES.PASSENGER));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/rides', getRideHistory);
router.post('/saved-addresses', addSavedAddress);
router.delete('/saved-addresses/:addressId', deleteSavedAddress);

module.exports = router;