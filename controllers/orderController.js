const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product'); // Import Product model
const crypto = require('crypto');

const generateUniqueCouponCode = (prefix = 'COUPON') => {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
};

const createOrder = async (req, res) => {
  const { items, firstName, lastName, phone, address, couponCode } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate the total cost
    const totalCost = items.reduce((total, item) => total + item.price * item.quantity, 0);

    // Calculate the discount and mark the coupon as used if applicable
    let discount = 0;
    let usedCoupon = null; 

    if (couponCode) {
      const couponIndex = user.coupons.findIndex(c => c.code === couponCode && !c.isUsed);
      if (couponIndex !== -1) {
        const coupon = user.coupons[couponIndex];
        discount = coupon.discount;
        user.coupons[couponIndex].isUsed = true; // Mark the coupon as used
        usedCoupon = coupon; 
      }
    }

    const finalCost = totalCost - discount;

    // Format order items
    const formattedItems = items.map(item => ({
      ...item,
      productId: new mongoose.Types.ObjectId(item.productId), 
    }));

    // Create new order
    const newOrder = new Order({
      userId: userId,
      items: formattedItems,
      totalCost: finalCost,
      firstName,
      lastName,
      phone,
      address,
    });

    await newOrder.save();

    // Update product quantities
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        await product.updateQuantity(item.color, item.quantity); 
      } else {
        throw new Error('Product not found');
      }
    }


    user.totalSpent += finalCost;


    const couponThresholds = [
      { threshold: 10000, discount: 1000 },
      { threshold: 50000, discount: 2500 },
      { threshold: 100000, discount: 5000 },
    ];

    couponThresholds.forEach(threshold => {
      if (user.totalSpent >= threshold.threshold && !user.coupons.find(c => c.discount === threshold.discount)) {
        const newCouponCode = generateUniqueCouponCode();
        user.coupons.push({ code: newCouponCode, discount: threshold.discount, isUsed: false });
      }
    });

    // Mark the subdocument as modified
    user.markModified('coupons');

    // Save the user document
    await user.save();

    // Log used coupon information
    if (usedCoupon) {
      console.log(`User ${user.email} used coupon ${usedCoupon.code} (${usedCoupon.discount}$ off)`);
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating order' });
  }
};

const getOrdersByUserId = async (req, res) => {
  const userId = req.params.userId;

  try {
    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
};


const getOrders = async (req, res) => {
  const { status } = req.query; 
  const page = parseInt(req.query.page) || 1; 
  const limit = parseInt(req.query.limit) || 10; 

  try {

    const query = status ? { status } : {};
    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) 
      .skip((page - 1) * limit) 
      .limit(limit); 

    const totalOrders = await Order.countDocuments(query); 
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      orders,
      totalOrders,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
};


const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
      const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
      if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
      }

      const order = await Order.findById(id);
      if (!order) {
          return res.status(404).json({ error: 'Order not found' });
      }

      order.status = status;
      await order.save();

      res.status(200).json(order);
  } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Error updating order status' });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
      const order = await Order.findByIdAndDelete(id);
      if (!order) {
          return res.status(404).json({ error: 'Order not found' });
      }

      res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Error deleting order' });
  }
};


module.exports = {
  createOrder,
  getOrdersByUserId,
  getOrders,
  updateOrderStatus,
  deleteOrder,
};