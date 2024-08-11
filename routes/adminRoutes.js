// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getAdminStats, getLatestOrders, promoteUser, demoteUser, deleteUser } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
router.get('/stats', protect, authorizeRoles(), getAdminStats);
router.get('/orders', protect, authorizeRoles(), getLatestOrders);
// Promote user
router.patch('/:id/promote', protect, authorizeRoles(), promoteUser);

// Demote user
router.patch('/:id/demote', protect, authorizeRoles(), demoteUser);

// Delete user
router.delete('/:id', protect, authorizeRoles(), deleteUser); 

module.exports = router;