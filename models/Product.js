const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
    color: { type: String, required: true },
    quantity: { type: Number, required: true }
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    colors: { type: [colorSchema], required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    images: { type: [String], required: true },
    category: { type: String, required: true }
});

// Add method to update product quantity
productSchema.methods.updateQuantity = async function (color, quantity) {
    const colorObj = this.colors.find(c => c.color === color);
    if (colorObj) {
        if (colorObj.quantity < quantity) {
            throw new Error('Not enough stock available');
        }
        colorObj.quantity -= quantity;
        await this.save();
    } else {
        throw new Error('Color not found');
    }
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;