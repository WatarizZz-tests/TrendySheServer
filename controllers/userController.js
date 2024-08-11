const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 15 } = req.query;


        const users = await User.find({ isOwner: false })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        
        const totalUsers = await User.countDocuments({ isOwner: false });
        const totalPages = Math.ceil(totalUsers / limit);
        
        res.json({
            users,
            totalPages
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log(`Login attempt for email: ${email}`);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('User found, comparing passwords');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Passwords do not match');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('Passwords match, generating tokens');
        const token = jwt.sign(
            { userId: user._id, isOwner: user.isOwner, isWorker: user.isWorker },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } 
        );


        user.recoveryToken = refreshToken;
        await user.save();

        res.json({ token, refreshToken});
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    console.log('Received refreshToken:', refreshToken);

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        console.log('Decoded refreshToken:', decoded);

        const user = await User.findOne({ _id: decoded.userId, recoveryToken: refreshToken }); // Use recoveryToken

        if (!user) {
            console.log('User not found or invalid refreshToken');
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const token = jwt.sign(
            { userId: user._id, isOwner: user.isOwner, isWorker: user.isWorker },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Fetch user data including coupons
const getUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getWishlist = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(req.user._id).select('wishlist');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Convert ObjectId to string
        const wishlist = user.wishlist.map(item => item.toString());
        console.log(wishlist);

        res.json(wishlist);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const addToWishlist = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        console.log('Request body:', req.body); 
        const { productId } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }
        user.wishlist.push(productId);
        await user.save();
        res.json({ message: 'Product added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const { productId } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();
        res.json({ message: 'Product removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Forgot Password Controller
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a recovery token
        const recoveryToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        user.recoveryToken = recoveryToken; 
        await user.save();

        // Create the transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
              user: "nodemailerpassrec@zohomail.com",
              pass: "DangDang99"
            },
            tls: {
              rejectUnauthorized: false // Ignore SSL certificate errors
            }
          });

        // Setup mail options
        const mailOptions = {
            from: 'nodemailerpassrec@zohomail.com',
            to: email,
            subject: 'Réinitialisation du mot de passe',
            text: `
Cher utilisateur,

Vous avez récemment demandé à réinitialiser votre mot de passe pour notre plateforme. Pour procéder à la réinitialisation, veuillez cliquer sur le lien ci-dessous:

http://localhost:3000/reset_password/${user._id}/${recoveryToken}

Si vous n'avez pas effectué cette demande de réinitialisation de mot de passe, veuillez ignorer cet e-mail. La sécurité de votre compte est importante pour nous.

Cordialement,
TrendyShe
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error while sending email:', error);
                return res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
            } else {
                console.log('Email sent:', info.response);
                return res.status(200).json({ message: "Email de réinitialisation envoyé avec succès" });
            }
        });

    } catch (err) {
        console.error('Error during password recovery:', err);
        return res.status(500).json({ message: "Une erreur s'est produite lors de la récupération de l'utilisateur" });
    }
};


const resetPassword = async (req, res) => {
    const { userId, recoveryToken, newPassword } = req.body;

    if (!userId || !recoveryToken || !newPassword) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Validate the token and userId
        const user = await User.findOne({ _id: userId, recoveryToken });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash the new password and save it
        user.password = await bcrypt.hash(newPassword, 10);
        user.recoveryToken = null; // Invalidate the token
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

  



module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUserPassword,
    loginUser,
    getUserData,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    forgotPassword,
    resetPassword,
    refreshToken
};
