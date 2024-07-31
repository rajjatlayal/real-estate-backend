const mongoose = require('mongoose');

const UpcomingProjectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  noOfApartments: {
    type: Number,
    required: true,
  },
  investment: {
    type: Number,
    required: true,
  },
  file: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

const UpcomingProject = mongoose.model('UpcomingProject', UpcomingProjectSchema);

module.exports = UpcomingProject;
