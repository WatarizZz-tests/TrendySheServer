// controllers/adminController.js

const Order = require('../models/Order');
const User = require('../models/User');

const getAdminStats = async (req, res) => {
    try {
      const totalSpent = await User.aggregate([
        { $group: { _id: null, totalSpent: { $sum: '$totalSpent' } } }
      ]);
      const totalOrders = await Order.countDocuments();
  
      // Get orders for the last 30 days or by month based on query parameter
      const { period = 'days' } = req.query;
      const matchStage = period === 'months' 
        ? { $match: { createdAt: { $gte: new Date(Date.now() - 365*24*60*60*1000) } } }
        : { $match: { createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } };
  
      const stats = await Order.aggregate([
        matchStage,
        {
          $group: {
            _id: period === 'months' 
              ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
              : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$totalCost" }
          }
        },
        { $sort: { _id: 1 } }
      ]);
  
      res.json({
        totalSpent: totalSpent[0] ? totalSpent[0].totalSpent : 0,
        totalOrders,
        dates: stats.map(stat => stat._id),
        values: stats.map(stat => stat.total),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Error fetching stats' });
    }
  };
  

const getLatestOrders = async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name'); 

    res.json(orders);
  } catch (error) {
    console.error('Error fetching latest orders:', error);
    res.status(500).json({ error: 'Error fetching latest orders' });
  }
};


// Promote a user to worker
const promoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isWorker = true;
    await user.save();
    res.status(200).json({ message: 'User promoted to worker', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Demote a user from worker
const demoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isWorker = false;
    await user.save();
    res.status(200).json({ message: 'User demoted from worker', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is an owner
    if (user.isOwner) {
      return res.status(403).json({ message: 'Cannot delete an owner account' });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getLatestOrders,
  demoteUser,
  promoteUser,
  deleteUser,
};
