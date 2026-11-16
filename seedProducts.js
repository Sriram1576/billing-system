const mongoose = require('mongoose');
const Product = require('./backend/models/Product');
require('dotenv').config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-system')
  .then(async () => {
    const products = [
      { name: 'Wireless Mouse', category: 'Electronics', price: 999, description: 'Ergonomic wireless mouse with 2.4GHz connection', stock: 50 },
      { name: 'Mechanical Keyboard', category: 'Electronics', price: 3499, description: 'RGB mechanical keyboard with blue switches', stock: 20 },
      { name: 'Water Bottle', category: 'Accessories', price: 499, description: 'Stainless steel 1L insulated water bottle', stock: 100 },
      { name: 'Leather Wallet', category: 'Fashion', price: 1299, description: 'Genuine leather bifold wallet', stock: 35 },
      { name: 'Running Shoes', category: 'Footwear', price: 2999, description: 'Lightweight running shoes for men', stock: 15 },
      { name: 'Cotton T-Shirt', category: 'Fashion', price: 699, description: '100% pure cotton casual t-shirt', stock: 80 }
    ];
    
    for (let p of products) {
      try {
        await new Product(p).save();
        console.log('Added:', p.name);
      } catch (err) {
        console.log('Failed to add (it might already exist):', p.name);
      }
    }
    console.log('Finished seeding products!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
