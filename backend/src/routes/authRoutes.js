const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/health', authController.health);
router.get('/profile/:userId', verifyToken, authController.getUserProfile);


router.post('/register', authController.register);
router.post('/login', authController.login);


router.post('/logout', verifyToken, authController.logout);

module.exports = router;
