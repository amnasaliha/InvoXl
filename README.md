# INVOXL — Invoice Intelligence Platform

> **AI-powered invoice extraction, analytics, and forecasting for e-commerce sellers.**

---

## Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Setup & Installation](#5-setup--installation)
6. [Environment Variables](#6-environment-variables)
7. [Running the App](#7-running-the-app)
8. [API Reference](#8-api-reference)
9. [Data Model](#9-data-model)
10. [PDF Extraction Pipeline](#10-pdf-extraction-pipeline)
11. [AI Chatbot](#11-ai-chatbot)
12. [Analytics & Forecasting](#12-analytics--forecasting)
13. [Known Issues & Troubleshooting](#13-known-issues--troubleshooting)

---

## 1. Overview

INVOXL is a full-stack web application that allows e-commerce sellers (primarily Meesho sellers) to:

- **Upload invoice PDFs** and automatically extract structured data using Python + OCR
- **View analytics** — revenue charts, platform distribution, top states, and KPIs
- **Forecast future revenue** using a machine-learning prediction model
- **Chat with an AI assistant** about their invoice data
- **Export** extracted data to Excel

---

## 2. Features

| Feature | Description |
|---|---|
| 📄 PDF Upload | Upload single or batch Meesho invoice PDFs |
| 🤖 Auto Extraction | Python script parses invoice fields (IDs, dates, customer, amounts, GST) |
| 📊 Dashboard | Revenue timeline, platform distribution pie chart, top states, and KPI cards |
| 📈 Forecast | ML-based 7-day revenue prediction using past invoice data |
| 💬 AI Chat | OpenAI-powered assistant with full invoice context |
| 📥 Excel Export | Download extracted data as `.xlsx` |
| 🔐 Authentication | JWT-based login/register with bcrypt password hashing |
| 👤 Profile | View account info and invoice count |
| ❓ Help | In-app help page |

---

## 3. Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router 6 | Client-side routing |
| Axios | HTTP client (proxied to backend) |
| Recharts | Charts (bar, pie, line) |
| Tailwind CSS | Utility styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| JWT + bcryptjs | Authentication |
| Multer | PDF file upload handling |
| ExcelJS | Excel file generation |
| OpenAI SDK | AI chat responses |

### Python
| Technology | Purpose |
|---|---|
| Python 3.x | Invoice extraction runtime |
| pdfplumber | PDF text extraction |
| re (stdlib) | Regex-based field parsing |
| json (stdlib) | Structured output to Node.js |

---

## 4. Project Structure

```
INVOXL/
├── backend/
│   ├── extract_invoices.py     # PDF extraction script (spawned by Node)
│   ├── pyrightconfig.json      # Disables Pylance type-checking warnings
│   ├── server.js               # Express app entry point
│   ├── .env                    # Environment variables (not committed)
│   ├── models/
│   │   ├── Invoice.js          # Invoice Mongoose schema
│   │   └── User.js             # User Mongoose schema
│   ├── routes/
│   │   ├── auth.js             # POST /api/auth/login, /register
│   │   ├── extract.js          # POST /api/extract  (PDF upload)
│   │   ├── invoices.js         # GET  /api/invoices
│   │   ├── analytics.js        # GET  /api/analytics/*
│   │   ├── export.js           # GET  /api/export
│   │   ├── chat.js             # POST /api/chat
│   │   └── invoiceReparse.route.js  # POST /api/invoices/:id/reparse
│   ├── utils/
│   │   ├── invoiceService.js   # saveInvoices(), generateExcel()
│   │   ├── ocrParser.js        # JS-based OCR fallback parser
│   │   └── dateUtils.js        # parseToISO() — unified date normalisation
│   └── middleware/
│       ├── authMiddleware.js   # JWT verification
│       └── errorMiddleware.js  # Global error handler
│
└── frontend/
    ├── package.json            # "proxy": "http://localhost:5001"
    └── src/
        ├── App.jsx             # Router setup
        ├── context/
        │   └── AuthContext.jsx # Global auth state (axios baseURL = /api)
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Home.jsx        # Landing page
            ├── Upload.jsx      # PDF upload + invoice table
            ├── Dashboard.jsx   # Analytics charts + KPIs
            ├── Prediction.jsx  # 7-day revenue forecast
            ├── Profile.jsx
            └── Help.jsx
```

---

## 5. Setup & Installation

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 8+ | Comes with Node.js |
| MongoDB | 6+ | Must be running on `localhost:27017` |
| Python | 3.8+ | Check **Add to PATH** during install |
| pdfplumber | latest | `pip install pdfplumber` |

### Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Python
pip install pdfplumber
```

---

## 6. Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
MONGO_URI=mongodb://localhost:27017/invoxl
JWT_SECRET=your_super_secret_key_here
PORT=5001
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | Backend server port (default: 5001) |
| `CLIENT_URL` | Frontend origin for CORS |
| `OPENAI_API_KEY` | OpenAI API key for AI chat feature |

> ⚠️ Never commit `.env` to version control.

---

## 7. Running the App

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd backend
npm start
# Expected output:
# ✅ MongoDB connected
# ✅ All routes loaded
# ✅ Server running → http://localhost:5001
```

```bash
# Terminal 2 — Frontend
cd frontend
npm start
# Opens http://localhost:3000 in your browser
```

> **MongoDB must be running first.** Start it with `mongod` or via MongoDB Compass.

---

## 8. API Reference

### Authentication

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Returns JWT token |

### Invoices

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/invoices` | List all invoices for logged-in user |
| POST | `/api/extract` | Upload PDF → extract & save invoices |
| POST | `/api/invoices/:id/reparse` | Re-parse a specific invoice |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/summary` | KPI cards (revenue, orders, avg order) |
| GET | `/api/analytics/revenue` | Daily revenue time series |
| GET | `/api/analytics/platforms` | Platform distribution |
| GET | `/api/analytics/states` | Top states by revenue |
| GET | `/api/analytics/forecast` | 7-day revenue forecast |

### Other

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/export` | Download invoices as Excel (.xlsx) |
| POST | `/api/chat` | Send message to AI assistant |
| GET | `/api/health` | Health check |

> All routes except `/api/auth/*` require `Authorization: Bearer <token>` header.

---

## 9. Data Model

### Invoice

```js
{
  userId:          ObjectId,       // Owner
  fileName:        String,         // Original PDF name

  invoiceNumber:   String,
  invoiceDate:     String,         // YYYY-MM-DD
  orderDate:       String,         // YYYY-MM-DD
  orderId:         String,
  trackingId:      String,

  customerName:    String,
  billingAddress:  String,
  state:           String,

  sku:             String,
  hsnCode:         String,
  productName:     String,
  quantity:        Number,

  grossAmount:     Number,
  discount:        Number,
  taxableAmount:   Number,
  cgst:            Number,
  sgst:            Number,
  igst:            Number,
  tax:             Number,
  shippingCharges: Number,
  total:           Number,
  finalAmount:     Number,

  supplierName:    String,         // Used as platform label
  platform:        String,         // e.g. "Meesho"
  
  createdAt:       Date,
}
```

### User

```js
{
  name:       String,
  email:      String,  // unique
  password:   String,  // bcrypt hashed
  createdAt:  Date,
}
```

---

## 10. PDF Extraction Pipeline

```
User uploads PDF
       ↓
Node.js (extract.js)
  → saves PDF to /uploads/
  → spawns python extract_invoices.py <path>
       ↓
Python (extract_invoices.py)
  → opens PDF with pdfplumber
  → extracts text page-by-page
  → parses fields with regex:
       • Order No / Invoice No (15-18 digit IDs)
       • Dates (DD.MM.YYYY → YYYY-MM-DD)
       • Customer name & address (BILL TO block)
       • State (GSTIN prefix + address regex)
       • SKU, HSN, Product Name
       • Amounts (gross, discount, taxable, GST, total)
  → prints JSON array to stdout
       ↓
Node.js receives JSON
  → saveInvoices() maps fields and inserts to MongoDB
  → returns saved invoices to frontend
       ↓
Frontend shows invoice table
```

### Supported Invoice Formats
- ✅ Meesho (primary — all regex patterns tuned for Meesho layout)
- ⚠️ Other platforms partially supported via generic amount/date patterns

---

## 11. AI Chatbot

The `/api/chat` route:
1. Fetches the last **50 invoices** from the user's database
2. Computes a quick summary (total revenue, order count, today's sales)
3. Builds a system prompt with this context
4. Sends the user's message to **OpenAI GPT** (`gpt-3.5-turbo` / `gpt-4`)
5. Returns the AI's response

Requires `OPENAI_API_KEY` in `.env`.

---

## 12. Analytics & Forecasting

### Dashboard KPIs
- **Total Revenue** — sum of all `finalAmount`
- **Total Orders** — invoice count
- **Average Order Value** — total revenue / order count
- **Latest Day Orders** — most recent date with data + order count

### Charts
- **Revenue Timeline** — daily revenue bar chart (last 30 days or full range)
- **Platform Distribution** — pie chart grouped by `platform` field
- **Top States** — bar chart of revenue by customer state

### Forecast
- Uses last 30 days of daily revenue data
- Fits a **linear regression** trend
- Projects the next **7 days** of revenue
- Displayed as a line chart on the Prediction page

### Date Standard
All dates stored and queried in **ISO format `YYYY-MM-DD`** via `dateUtils.parseToISO()`.

---

## 13. Known Issues & Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Backend crashes on start | MongoDB not running | Start MongoDB (`mongod` or Compass) |
| `ERR_CONNECTION_REFUSED` in browser | Backend server not running | Run `npm start` in `backend/` |
| PDF upload returns error | Python not installed or not on PATH | Install Python 3.8+, check "Add to PATH" |
| PDF upload returns empty data | `pdfplumber` not installed | Run `pip install pdfplumber` |
| Dashboard shows 0 values | No invoices in DB, or date format mismatch | Upload at least one PDF; run `node fix_dates.js` for existing data |
| AI chat not responding | Missing `OPENAI_API_KEY` | Add key to `.env` |
| IDE shows "pdfplumber not found" | Library not in IDE's Python env | Run `pip install pdfplumber` in the same Python env VS Code uses |
| Pyre/Pylance type errors in `.py` | Strict type checker | `pyrightconfig.json` disables this — reload VS Code |

### Running the Date Migration (one-time)
If you have existing invoices with non-standard dates:
```bash
cd backend
node fix_dates.js
```

---

---

## 14. Deployment Guide

### 🅰️ Frontend (Netlify)
1.  **Connect to GitHub**: Link your repository.
2.  **Build Settings**:
    -   **Base directory**: `frontend`
    -   **Build command**: `npm run build`
    -   **Publish directory**: `build`
3.  **Environment Variables**:
    -   Add `REACT_APP_API_URL` = `https://your-backend.onrender.com`
4.  **SPA Routing**: The `netlify.toml` in the project root handles redirects for React Router.

### 🅱️ Backend (Render)
1.  **Create Web Service**: Connect to GitHub.
2.  **Build Settings**:
    -   **Root Directory**: `backend`
    -   **Build Command**: `npm install`
    -   **Start Command**: `node server.js`
3.  **Environment Variables**:
    -   `MONGO_URI` = Your MongoDB Atlas connection string.
    -   `JWT_SECRET` = A strong secret key.
    -   `PORT` = `10000` (Render's default, handles internally).
    -   `OPENAI_API_KEY` = Your OpenAI key for AI features.

---

## License

Private project. All rights reserved.
