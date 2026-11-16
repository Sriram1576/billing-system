const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).populate('items.productId');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('items.productId');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { customerName, customerPhone, items, couponCode } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Transaction must include items' });
    }
    
    let subtotalSum = 0;
    const processedItems = [];

    // Verify stock and calculate subtotal securely
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product not found or inactive: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      const itemSubtotal = product.price * item.quantity;
      subtotalSum += itemSubtotal;
      
      processedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal
      });
      
      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }
    
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon && subtotalSum >= coupon.minPurchase) {
        if (coupon.discountType === 'percent') {
          discountAmount = (subtotalSum * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }
    
    const totalAmount = subtotalSum - discountAmount;
    
    const transaction = new Transaction({
      customerName,
      customerPhone,
      items: processedItems,
      couponCode,
      discountAmount,
      totalAmount
    });
    
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
