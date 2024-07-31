// models/Blog.js
const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    required: true,
  },
  bannerImage: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BlogModel = mongoose.model('Blog', BlogSchema);
module.exports = BlogModel;
