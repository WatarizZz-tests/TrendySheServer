const express = require('express');
const {
    getUsers,
    getUserById,
    createUser,
    updateUserPassword,
    loginUser,
    getUserData,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    forgotPassword,
    resetPassword,
    refreshToken
} = require('../controllers/userController');
const { protect, ensureCorrectUser, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public Routes
router.get('/', protect, authorizeRoles() ,  getUsers); // Fetch all users
router.post('/', createUser); // Create a new user
router.post('/login', loginUser); // Login user
router.post('/forgot-password', forgotPassword); // recover password
router.post('/reset-password', resetPassword); //reset password
router.post('/refresh-token', refreshToken); // Refresh access token



// Protected Routes
router.use(protect); // Apply middleware to all routes below this line

router.get('/me', getUserData); // Fetch current user's data



router.get('/wishlist', getWishlist); // Fetch user's wishlist
router.post('/wishlist/add', addToWishlist); // Add product to wishlist
router.post('/wishlist/remove', removeFromWishlist); // Remove product from wishlist

// Dynamic Routes
router.put('/:id/update-password', ensureCorrectUser, updateUserPassword); // Update password for current user
router.get('/:id', getUserById); // Fetch user by ID


module.exports = router;
