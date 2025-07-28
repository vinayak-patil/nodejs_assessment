const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['user', 'admin'],
    default: 'user'
  },
  description: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'admin']
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema); 