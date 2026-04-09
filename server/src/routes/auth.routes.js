const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  registerPassenger,
  registerDriver,
  loginPassenger,
  loginDriver,
  getMe,
} = require('../controllers/auth.controller');

router.post('/register/passenger', registerPassenger);
router.post('/register/driver', registerDriver);
router.post('/login/passenger', loginPassenger);
router.post('/login/driver', loginDriver);
router.get('/me', authenticate, getMe);

module.exports = router;