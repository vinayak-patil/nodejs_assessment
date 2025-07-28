# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Node.js (v14 or higher)
- MongoDB running locally or MongoDB Atlas account

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
The `config.env` file is already created with default settings:
- Port: 3000
- MongoDB: localhost:27017/blogging-platform
- JWT Secret: your-super-secret-jwt-key-change-this-in-production

### 4. Start MongoDB
Make sure MongoDB is running on your system.

### 5. Seed the Database
```bash
node utils/seeder.js
```

### 6. Start the Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get All Posts
```bash
curl http://localhost:3000/api/posts
```

### Get Trending Posts
```bash
curl http://localhost:3000/api/posts/trending
```

## 📋 Sample Data Created

### Users
- **John Doe** (john@example.com) - password: password123
- **Jane Smith** (jane@example.com) - password: password123
- **Admin User** (admin@example.com) - password: admin123

### Categories
- Technology
- Travel
- Lifestyle
- Business

### Sample Posts
- Introduction to Node.js
- Best Travel Destinations for 2024
- The Future of Web Development

## 🔑 Admin Access

Use the admin account to test admin-only endpoints:
- Email: admin@example.com
- Password: admin123

## 📚 Full Documentation

See `README.md` for complete API documentation and examples.

## 🛠️ Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `node utils/seeder.js` - Seed database with sample data
- `node utils/seeder.js -d` - Clear all data from database 