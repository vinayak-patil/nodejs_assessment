# Blogging Platform API

A complete RESTful API for a blogging platform built with Node.js, Express, MongoDB, and JWT authentication. Features include user management, role-based access control, blog posts, comments, and categories.

## Features

- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 👥 **Role-Based Access Control** - User and Admin roles with different permissions
- 📝 **Blog Post Management** - Create, read, update, and delete blog posts
- 💬 **Comment System** - Nested comments with replies and likes
- 📂 **Category Management** - Organize posts by categories
- 🔍 **Search & Filtering** - Search posts and filter by categories
- 📊 **Trending Posts** - Aggregation pipeline for top posts
- 🛡️ **Security** - Password hashing, rate limiting, and input validation
- 📄 **Pagination** - Efficient data loading with pagination support

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blogging-platform-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `config.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/blogging-platform
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=24h
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Seed the database**
   ```bash
   node utils/seeder.js
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user profile | Private |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users/me` | Get current user profile | Private |
| PUT | `/api/users/me` | Update user profile | Private |
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PATCH | `/api/users/:id/status` | Activate/Deactivate user | Admin |

### Categories

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/categories` | Get all categories | Public |
| GET | `/api/categories/:id` | Get category by ID | Public |
| POST | `/api/categories` | Create new category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Blog Posts

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/posts` | Get all posts | Public |
| GET | `/api/posts/:id` | Get post by ID | Public |
| POST | `/api/posts` | Create new post | Private |
| PUT | `/api/posts/:id` | Update post | Author/Admin |
| DELETE | `/api/posts/:id` | Delete post | Author/Admin |
| GET | `/api/posts/category/:categoryId` | Get posts by category | Public |
| GET | `/api/posts/trending` | Get trending posts | Public |

### Comments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/comments/post/:postId` | Get comments for post | Public |
| POST | `/api/comments` | Add comment to post | Private |
| PUT | `/api/comments/:id` | Update comment | Author/Admin |
| DELETE | `/api/comments/:id` | Delete comment | Author/Admin |
| POST | `/api/comments/:id/like` | Like/Unlike comment | Private |
| PATCH | `/api/comments/:id/approve` | Approve/Disapprove comment | Admin |
| GET | `/api/comments/:id/replies` | Get comment replies | Public |

## Request Examples

### User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure123"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
```

### Create Blog Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Introduction to Node.js",
    "content": "Node.js is a powerful runtime environment...",
    "category": "Technology",
    "tags": ["nodejs", "javascript"],
    "excerpt": "Learn the basics of Node.js"
  }'
```

### Add Comment
```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Great article! Very informative.",
    "post": "POST_ID_HERE"
  }'
```

## Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ObjectId (ref: 'Role'),
  avatar: String,
  bio: String,
  isActive: Boolean,
  timestamps: true
}
```

### Roles Collection
```javascript
{
  name: String (enum: ['user', 'admin']),
  description: String,
  permissions: [String],
  timestamps: true
}
```

### Categories Collection
```javascript
{
  name: String (unique),
  description: String,
  slug: String (auto-generated),
  isActive: Boolean,
  timestamps: true
}
```

### Posts Collection
```javascript
{
  title: String,
  content: String,
  excerpt: String,
  slug: String (auto-generated),
  author: ObjectId (ref: 'User'),
  category: ObjectId (ref: 'Category'),
  tags: [String],
  featuredImage: String,
  status: String (enum: ['draft', 'published', 'archived']),
  viewCount: Number,
  isFeatured: Boolean,
  timestamps: true
}
```

### Comments Collection
```javascript
{
  text: String,
  post: ObjectId (ref: 'Post'),
  author: ObjectId (ref: 'User'),
  parentComment: ObjectId (ref: 'Comment'),
  replies: [ObjectId],
  likes: [ObjectId (ref: 'User')],
  isApproved: Boolean,
  isEdited: Boolean,
  timestamps: true
}
```

## Sample Data

The seeder script creates the following sample data:

### Users
- **John Doe** (john@example.com) - Regular user
- **Jane Smith** (jane@example.com) - Regular user  
- **Admin User** (admin@example.com) - Administrator

### Categories
- Technology
- Travel
- Lifestyle
- Business

### Sample Posts
- Introduction to Node.js
- Best Travel Destinations for 2024
- The Future of Web Development

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Different permissions for users and admins
- **Input Validation**: All inputs are validated using express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing protection
- **Helmet Security**: Various HTTP headers for security

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if any
}
```

## Pagination

Most list endpoints support pagination:

```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  },
  "data": { ... }
}
```

## Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Get All Posts
```bash
curl http://localhost:3000/api/posts
```

### Get Trending Posts
```bash
curl http://localhost:3000/api/posts/trending
```

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `node utils/seeder.js` - Seed the database with sample data
- `node utils/seeder.js -d` - Clear all data from the database

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/blogging-platform |
| JWT_SECRET | JWT signing secret | your-super-secret-jwt-key-change-this-in-production |
| JWT_EXPIRE | JWT token expiration | 24h |
| NODE_ENV | Environment mode | development |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 