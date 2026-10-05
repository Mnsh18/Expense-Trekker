# 💰 Expense Trekker

A full-stack personal finance and expense tracking application built with **React, FastAPI, and MySQL**.

Expense Trekker allows users to securely manage their income and expenses, view their financial summary, analyze spending by category, and manage individual transactions through a web-based dashboard.

---

## 🚀 Features

- 🔐 User registration and login
- 🔑 JWT-based authentication
- 🔒 Password hashing using Argon2
- 💰 Add income and expense transactions
- ✏️ Edit transactions
- 🗑️ Delete transactions
- 📋 View transaction history
- 📊 View total income, expenses, and balance
- 📈 Expense analysis by category
- 👤 User profile information
- 📅 Automatic transaction date and time
- 🗄️ MySQL database
- ⚡ FastAPI backend
- ⚛️ React frontend

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Recharts

### Backend

- Python
- FastAPI
- SQLAlchemy
- PyJWT
- pwdlib
- Argon2

### Database

- MySQL 8.0

### Development Tools

- VS Code
- Git
- GitHub
- Postman
- Swagger / OpenAPI

---

## 🏗️ Project Architecture

```text
Expense Treker Project
│
├── Backend
│   ├── __init__.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── test_db.py
│
├── Frontend
│   ├── public
│   ├── src
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .env
├── .gitignore
├── requirements.txt
└── README.md