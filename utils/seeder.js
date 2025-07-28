const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const Category = require('../models/Category');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data
const roles = [
  {
    name: 'user',
    description: 'Regular user with basic permissions',
    permissions: ['read', 'write']
  },
  {
    name: 'admin',
    description: 'Administrator with full permissions',
    permissions: ['read', 'write', 'delete', 'admin']
  }
];

const categories = [
  {
    name: 'Technology',
    description: 'Articles about technology, programming, and software development'
  },
  {
    name: 'Travel',
    description: 'Travel guides, tips, and experiences from around the world'
  },
  {
    name: 'Lifestyle',
    description: 'Lifestyle tips, health, and wellness articles'
  },
  {
    name: 'Business',
    description: 'Business insights, entrepreneurship, and career advice'
  }
];

const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    bio: 'Software developer and tech enthusiast'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    bio: 'Travel blogger and adventure seeker'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    bio: 'System administrator'
  }
];

const posts = [
  {
    title: 'Introduction to Node.js',
    content: 'Node.js is a powerful runtime environment that allows you to build scalable network applications using JavaScript. It uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications that run across distributed devices.',
    excerpt: 'Learn the basics of Node.js and why it\'s become so popular for building modern web applications.',
    tags: ['nodejs', 'javascript', 'programming'],
    status: 'published'
  },
  {
    title: 'Best Travel Destinations for 2024',
    content: 'As we approach 2024, the world of travel is evolving with new trends and destinations gaining popularity. From sustainable tourism to digital nomad hotspots, here are the top destinations that should be on your radar for the coming year.',
    excerpt: 'Discover the most exciting travel destinations for 2024 and start planning your next adventure.',
    tags: ['travel', 'destinations', '2024'],
    status: 'published'
  },
  {
    title: 'The Future of Web Development',
    content: 'Web development is constantly evolving with new technologies, frameworks, and methodologies emerging regularly. From the rise of JAMstack to the increasing importance of performance and accessibility, the landscape is changing rapidly.',
    excerpt: 'Explore the latest trends and technologies shaping the future of web development.',
    tags: ['web-development', 'technology', 'trends'],
    status: 'published'
  }
];

const comments = [
  {
    text: 'Great article! Node.js has really revolutionized backend development.',
    isApproved: true
  },
  {
    text: 'I\'ve been using Node.js for years and it\'s amazing how much the ecosystem has grown.',
    isApproved: true
  },
  {
    text: 'These travel destinations look incredible! I\'m definitely adding them to my bucket list.',
    isApproved: true
  },
  {
    text: 'The JAMstack approach has been a game-changer for our projects.',
    isApproved: true
  }
];

// Import data into database
const importData = async () => {
  try {
    // Clear existing data
    await Role.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();
    await Post.deleteMany();
    await Comment.deleteMany();

    console.log('Data cleared');

    // Create roles
    const createdRoles = await Role.insertMany(roles);
    console.log('Roles imported');

    // Create users
    const userRole = createdRoles.find(role => role.name === 'user');
    const adminRole = createdRoles.find(role => role.name === 'admin');

    const userData = users.map((user, index) => ({
      ...user,
      role: index === 2 ? adminRole._id : userRole._id // Third user is admin
    }));

    const createdUsers = await User.insertMany(userData);
    console.log('Users imported');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories imported');

    // Create posts
    const techCategory = createdCategories.find(cat => cat.name === 'Technology');
    const travelCategory = createdCategories.find(cat => cat.name === 'Travel');

    const postData = posts.map((post, index) => ({
      ...post,
      author: createdUsers[index % createdUsers.length]._id,
      category: index === 0 ? techCategory._id : 
                index === 1 ? travelCategory._id : 
                techCategory._id
    }));

    const createdPosts = await Post.insertMany(postData);
    console.log('Posts imported');

    // Create comments
    const commentData = comments.map((comment, index) => ({
      ...comment,
      post: createdPosts[index % createdPosts.length]._id,
      author: createdUsers[index % createdUsers.length]._id
    }));

    await Comment.insertMany(commentData);
    console.log('Comments imported');

    console.log('Data import completed successfully');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Delete all data
const destroyData = async () => {
  try {
    await Role.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();
    await Post.deleteMany();
    await Comment.deleteMany();

    console.log('Data destroyed');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

// Handle command line arguments
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
} 