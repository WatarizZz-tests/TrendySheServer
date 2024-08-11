const express = require('express');
const router = express.Router();
const { createOrder, getOrdersByUserId, getOrders, updateOrderStatus, deleteOrder } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createOrder); // Apply protect middleware here
router.get('/:userId', protect, getOrdersByUserId); // Apply protect middleware here if needed
router.get('/', protect, getOrders); // Fetch orders with status filter
router.patch('/:id/status', protect, updateOrderStatus); // Update order status
router.delete('/:id', protect, deleteOrder); // Delete order

module.exports = router;
