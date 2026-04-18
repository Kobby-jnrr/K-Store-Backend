# K-Store Backend API

This is the server-side application for **K-Store**, a peer-to-peer marketplace platform built for university students. It handles data management, user authentication, and secure transactions.

## 🛠 Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Bcrypt (Password hashing)
- **File Handling:** Multer

## ✨ Key Features
- **User Authentication:** Secure registration and login system.
- **Product Management:** Full CRUD operations (Create, Read, Update, Delete) for marketplace items.
- **Relational Database:** Structured MySQL schema for efficient data handling.
- **Protected Routes:** Secure endpoints that require valid tokens to access.

## 🚀 Setup Instructions
1. Clone the repository:
   `git clone https://github.com/Kobby-jnrr/K-Store-Backend.git`
2. Install dependencies:
   `npm install`
3. Create a `.env` file in the root and add your DB credentials.
4. Start the server:
   `npm start`
