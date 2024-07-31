const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  }
});

const ReviewModel = mongoose.model('Review', commentSchema);

module.exports = ReviewModel;
