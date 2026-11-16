# Project Overview
This is a full-stack Point of Sale (POS) and Inventory Management System. It features an Admin Dashboard for managing product catalogs (inventory, descriptions, and pricing) and a Billing Counter interface for staff to process customer sales, apply verified coupons, automatically deduce stock, and generate comprehensive sales receipts securely.

# Tech Stack
* **Frontend:** React (Vite), React Router, TailwindCSS, Axios, Lucide React (Icons)
* **Backend:** Node.js, Express.js
* **Database & ORM:** MongoDB, Mongoose
* **Security & Auth:** JSON Web Tokens (JWT), CORS

# Folder Structure
```text
billing-system/
├── backend/
│   ├── .env
│   ├── server.js               # Express app entry point
│   ├── middleware/auth.js      # JWT verification logic
│   ├── models/                 # Product, Transaction, Coupon schemas
│   └── routes/                 # auth, products, transactions, coupons API logic
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # React Router config & Layout
        ├── components/         # Navbar, ProductForm modals
        └── pages/              # Admin, Billing, and Login views
```

# How to Run Locally

1. **Database:** Ensure a local MongoDB instance is running on port `27017` (or configure a remote URI in `.env`).
2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file in the `backend` folder with these exact keys:*
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/billing-system
   JWT_SECRET=supersecretjwtkey123
   ```
   *Start Backend:* `node server.js` (Runs on `http://localhost:5000`)
3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Runs on `http://localhost:5173`.*

# Key Endpoints
* **Auth:** `POST /api/auth/login` - Authenticate admin to receive JWT.
* **Products:** 
  * `GET /api/products` - List all products.
  * `POST /api/products` - Create product (Auth required).
  * `PUT /api/products/:id` - Update product (Auth required).
  * `DELETE /api/products/:id` - Delete product (Auth required).
* **Transactions:** 
  * `POST /api/transactions` - Process a sale, verify stock, & securely calculate totals.
  * `GET /api/transactions` - List historical transactions.
  * `GET /api/transactions/:id` - Fetch single transaction receipt.
* **Coupons:** `GET /api/coupons/validate?code=XYZ` - Securely preview discount rules.

# Frontend Pages / Flows
* `/login` – Simple JWT authentication gate.
* `/admin` – Admin Dashboard for creating, editing, and deleting inventory items.
* `/billing` – Core POS checkout flow (Product Selection → Cart Management → Customer Info & Coupon → Final Receipt UI).

# Testing Checklist
* [ ] Login using the admin credentials (`admin` / `admin123`).
* [ ] Add a new product via the Admin Panel, ensuring Name, Description, Price, and Stock save successfully.
* [ ] Verify the new product renders accurately on the Billing Counter.
* [ ] Attempt to add more quantity to the cart than the available stock to verify the UI boundary block.
* [ ] Enter customer details and apply the `SAVE10` coupon to preview the 10% discount.
* [ ] Complete a transaction and verify the stock decreases automatically in the Admin panel.
* [ ] Directly access a single transaction ID via Postman (`GET /api/transactions/:id`) to ensure receipt fetching works.

# Possible Future Enhancements
* Role-Based Access Control (RBAC) to separate Admin vs. Standard Billing Staff permissions.
* Printable PDF receipt generation using `window.print()` or libraries like `jspdf`.
* Analytical charts on the dashboard representing daily sales volume.
* Scheduled or dynamic coupon expiry dates.
* Push notifications or visual UI alerts for low-stock inventory limits.
