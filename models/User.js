const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    recoveryToken: {
        type: String,
    },
    totalSpent: { 
        type: Number, 
        default: 0 
    },
    coupons: [
        {
            code: String,
            discount: Number,
            isUsed: {
                type: Boolean,
                default: false,
            },
        },
    ],
    isOwner: {
        type: Boolean,
        default: false,
    },
    isWorker: {
        type: Boolean,
        default: false,
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
