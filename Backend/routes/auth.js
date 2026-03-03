const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get user profile (protected)
router.get('/profile', authenticateToken, authController.getProfile);

// Update user profile (protected)
router.put('/profile', authenticateToken, authController.updateProfile);

// Change password (protected)
router.put('/change-password', authenticateToken, authController.changePassword);

// Logout user (protected)
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;