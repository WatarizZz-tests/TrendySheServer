const jwt = require('jsonwebtoken');
const User = require('../models/User');


const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
          token = req.headers.authorization.split(' ')[1];
          console.log('Token:', token); 

          const decoded = jwt.verify(token, process.env.JWT_SECRET);


          req.user = await User.findById(decoded.userId).select('-password');


          next();
      } catch (error) {
          console.error('Error in protect middleware:', error);
          res.status(401).json({ message: 'Not authorized, token failed' });
      }
  } else {
      res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorizeRoles = () => {
  return (req, res, next) => {
    if (!req.user.isOwner && !req.user.isWorker) {
      return res.status(403).json({ message: 'User does not have the required role' });
    }
    next();
  };
};

  
  

const ensureCorrectUser = (req, res, next) => {
  if (req.user.id === req.params.id) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized, incorrect user' });
  }
};


module.exports = { protect, ensureCorrectUser, authorizeRoles };
