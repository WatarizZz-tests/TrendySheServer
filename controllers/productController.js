
const Product = require('../models/Product');

const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createProduct = async (req, res) => {
  try {
      const { name, price, colors, description, images, category } = req.body;

      console.log('Received data:', { name, price, colors, description, images, category });

      const newProduct = new Product({
          name,
          price,
          colors,
          description,
          images,
          category
      });

      await newProduct.save();

      res.status(201).json(newProduct);
  } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const getProductByName = async (req, res) => {
    const unslugify = (text) => {
        return decodeURIComponent(text)  // Decode URL-encoded characters
            .toString()
            .replace(/-/g, ' ');         // Replace dashes with spaces
    };

    try {
        const { category, productNameSlug } = req.params;
        const productName = unslugify(productNameSlug); // Convert slug back to original name
        console.log(`Category: ${category}, Product Name: ${productName}`); 
        const product = await Product.findOne({ category, name: productName });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error); // Log the error details
        res.status(500).json({ message: 'Server error' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



const getProductsByIds = async (req, res) => {
    try {
      const { ids } = req.query; 
      if (!ids) {
        return res.status(400).json({ message: 'No IDs provided' });
      }
  
      const productIds = ids.split(',');
      const products = await Product.find({ '_id': { $in: productIds } });
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };

  const getProducts = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query; 
      const skip = (page - 1) * limit;
  
      // Build the search query
      const searchQuery = search ? { name: { $regex: search, $options: 'i' } } : {};
  
      // Find products with search query
      const products = await Product.find(searchQuery).skip(skip).limit(Number(limit));
      const totalProducts = await Product.countDocuments(searchQuery); 
  
      res.json({
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: Number(page),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  

  const updateProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, colors, description, images, category } = req.body;
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      product.name = name || product.name;
      product.price = price || product.price;
      product.colors = colors || product.colors;
      product.description = description || product.description;
      product.images = images || product.images;
      product.category = category || product.category;
      await product.save();
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };

  const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await Product.findByIdAndDelete(id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

  
  module.exports = { getProductsByCategory, createProduct, getProductByName, getProductById, getProductsByIds, getProducts, updateProduct, updateProduct, deleteProduct };
  
  

  
