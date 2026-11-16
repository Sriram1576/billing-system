import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Receipt } from 'lucide-react';

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [couponCode, setCouponCode] = useState('');
  const [receipt, setReceipt] = useState(null);

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products');
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product._id === productId) {
          const newQ = item.quantity + delta;
          if (newQ <= 0) return null;
          if (newQ > item.product.stock) return item;
          return { ...item, quantity: newQ };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const [discountData, setDiscountData] = useState(null);

  const applyCoupon = async () => {
    try {
      const res = await api.get(`/coupons/validate?code=${couponCode}`);
      if (res.data.valid) {
        setDiscountData(res.data);
        alert(res.data.message);
      } else {
        setDiscountData(null);
        alert(res.data.message);
      }
    } catch (err) {
      alert('Failed to validate coupon');
      setDiscountData(null);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (discountData) {
    if (discountData.discountType === 'percent') {
      discountAmount = (subtotal * discountData.discountValue) / 100;
    } else {
      discountAmount = discountData.discountValue;
    }
  }
  const total = subtotal - discountAmount;

  const completeBilling = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    if (!customer.name || !customer.phone) return alert('Enter customer details');

    try {
      const payload = {
        customer,
        items: cart.map(i => ({ product: i.product._id, quantity: i.quantity })),
        subtotal,
        discount: discountAmount,
        total,
        couponCode: discountData ? couponCode : null
      };
      
      const res = await api.post('/transactions', payload);
      setReceipt(res.data); // Assuming backend returns the saved transaction
      setCart([]);
      setCustomer({ name: '', phone: '' });
      setCouponCode('');
      setDiscountData(null);
      fetchProducts(); // Refresh stock
    } catch (err) {
      alert('Failed to complete billing');
    }
  };

  if (receipt) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow mt-10">
        <div className="text-center mb-8">
          <Receipt className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Payment Successful</h2>
          <p className="text-gray-500 mt-2">Receipt ID: {receipt._id}</p>
        </div>
        
        <div className="border-t border-b border-gray-200 py-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium">{receipt.customer?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{receipt.customer?.phone}</span>
          </div>
        </div>

        <div className="mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm border-b">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Assuming receipt.items is populated with product details or we just use cart from memory, but ideally backend populates it. Fallback to just displaying totals if items aren't fully populated */}
              {receipt.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2">{item.product?.name || 'Product'}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">₹{item.price || (item.product?.price)}</td>
                  <td className="py-2 text-right">₹{((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-right">
          <p className="text-gray-600">Subtotal: ₹{receipt.subtotal?.toFixed(2) || subtotal.toFixed(2)}</p>
          {receipt.discount > 0 && <p className="text-green-600">Discount: -₹{receipt.discount?.toFixed(2)}</p>}
          <p className="text-2xl font-bold text-gray-900 pt-2 border-t">Total: ₹{receipt.total?.toFixed(2) || total.toFixed(2)}</p>
        </div>

        <button
          onClick={() => setReceipt(null)}
          className="mt-8 w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700"
        >
          New Transaction
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Products Grid */}
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col">
              <h3 className="font-medium text-gray-900 truncate">{p.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{p.category}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="font-bold text-lg">₹{p.price?.toFixed(2)}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                </span>
              </div>
              <button
                onClick={() => addToCart(p)}
                disabled={p.stock === 0}
                className="mt-4 w-full bg-indigo-50 text-indigo-700 py-2 rounded-md font-medium hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 flex flex-col h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2 rounded-t-lg">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Current Order</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">Cart is empty</p>
            ) : (
              cart.map((item) => (
                <div key={item.product._id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.product.name}</p>
                    <p className="text-gray-500 text-xs">₹{item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button onClick={() => updateQuantity(item.product._id, -1)} className="p-1 hover:bg-gray-100">
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product._id, 1)} 
                        disabled={item.quantity >= item.product.stock}
                        className="p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <span className="font-medium text-sm w-16 text-right">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4 rounded-b-lg">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer Name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={customer.name}
                onChange={e => setCustomer({...customer, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Customer Phone"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={customer.phone}
                onChange={e => setCustomer({...customer, phone: e.target.value})}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon Code (SAVE10)"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                />
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode}
                  className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountData && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discountData.discountType === 'percent' ? `${discountData.discountValue}%` : `₹${discountData.discountValue}`})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={completeBilling}
              disabled={cart.length === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-md font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              Complete Billing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
