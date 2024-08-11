const express = require('express');
const { createProduct, getProductsByCategory, getProductByName, getProductById, getProductsByIds, getProducts, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, authorizeRoles(), createProduct);
router.get('/products-by-ids', getProductsByIds); 
router.get('/all', protect , getProducts); 
router.put('/product/:id', protect, authorizeRoles(), updateProduct); 
router.get('/product/:id', getProductById); 
router.delete('/product/:id', protect, authorizeRoles(), deleteProduct);
router.get('/:category', getProductsByCategory);
router.get('/:category/:productNameSlug', getProductByName);



module.exports = router;
