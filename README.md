# Lumina Living — Curated Home Decor & Artisanal Furniture

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

<p align="center">
  <strong>An editorial luxury home decor and artisanal furniture e-commerce experience built with a lightweight Python 3 REST API backend and a responsive Vanilla HTML5/CSS3/JavaScript frontend.</strong>
</p>

</div>

---

## 📸 Preview

![Lumina Living Preview](public/images/preview.png)

---

## 🌟 Key Features

- 🛋️ **Curated Room Collections**: Browse sculptural lamps, bouclé lounge chairs, white oak coffee tables, and handcrafted ceramic vases.
- 🔍 **Live Search & Filter Tabs**: Filter items instantly by category (`lighting`, `seating`, `tables`, `decor`, `bedroom`) and keyword search.
- ↕️ **Custom Sorting**: Sort objects by ascending/descending price, customer reviews, or title.
- 🏺 **Artisan Object Detail View**: View material composition, dimensions, care instructions, and origin details.
- 🛍️ **Interactive Sliding Shopping Bag**:
  - Live quantity adjustment (+ / -) and subtotal calculations.
  - Persistent storage using `localStorage`.
  - Complimentary White Glove Delivery threshold indicator ($150+).
- 🎟️ **Privilege Promo Codes**: Real-time voucher discounts (e.g., `LUMINA15`, `HOMELUXE20`).
- 💳 **Atelier Checkout & Order Processing**:
  - Full client and delivery destination form validation.
  - Simulated 256-bit SSL encrypted payment processing.
  - Automatic inventory stock deduction upon order submission.
- 🧾 **Printable Invoice & Tracking**:
  - Printable receipt layout with dedicated print styles (`@media print`).
  - Order lookup and live status tracker (`LUM-XXXXX`).

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3, JavaScript | Editorial luxury aesthetic, Cormorant Garamond typography, CSS Grid & Flexbox, no external UI frameworks |
| **Backend** | Python 3 (`http.server`, `urllib`, `json`) | Native REST API server with zero external dependency overhead |
| **Database** | File-Based Persistent JSON | `data/products.json` (Catalog) & `data/orders.json` (Orders DB) |

---

## 📁 Project Structure

```
lumina-living-ecommerce/
│
├── 📁 data/
│   ├── products.json          # Curated home decor & furniture catalog
│   └── orders.json            # Persistent customer orders database
│
├── 📁 public/                 # Static frontend assets
│   ├── 📁 css/
│   │   └── style.css          # Editorial luxury styling & responsive design
│   ├── 📁 js/
│   │   └── app.js             # Cart state, modals, checkout & tracking logic
│   ├── 📁 images/             # Product imagery & UI assets
│   └── index.html             # Single-page storefront layout
│
├── server.py                  # Python 3 HTTP Server & REST API backend
├── .gitignore                 # Git ignore rules
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Python 3.8+](https://www.python.org/downloads/) installed on your machine.

### 2. Clone and Run
```bash
# Clone the repository
git clone https://github.com/hussainvalidudekula447-bit/lumina-living-ecommerce.git

# Navigate into the project directory
cd lumina-living-ecommerce

# Start the Python server
python server.py
```

### 3. Open in Browser
Visit **[http://localhost:5000](http://localhost:5000)** to explore the storefront!

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Get all products (supports `?category=`, `?search=`, `?sort=`) |
| `GET` | `/api/products/<id>` | Get details for a specific object |
| `GET` | `/api/categories` | Get category list and product counts |
| `POST` | `/api/promo/validate` | Validate privilege discount vouchers |
| `POST` | `/api/orders` | Process and save a new customer order |
| `GET` | `/api/orders` | Retrieve recent order history |
| `GET` | `/api/orders/<id>` | Look up order status by reference ID |

---

## 🎟️ Demo Promo Codes

| Promo Code | Discount | Description |
| :--- | :--- | :--- |
| `LUMINA15` | **15% OFF** | 15% Off Lumina Living Collection |
| `HOMELUXE20` | **20% OFF** | 20% Off Luxury Furniture & Decor |
| `WELCOME10` | **10% OFF** | 10% Welcome Gift |

---

## 👨‍💻 Author

- **Hussain Vali Dudekula**
- GitHub: [@hussainvalidudekula447-bit](https://github.com/hussainvalidudekula447-bit)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
