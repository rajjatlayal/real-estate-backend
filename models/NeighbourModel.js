const mongoose = require('mongoose');

const NeighbourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  distance: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  banner_image: {
    type: String,
    required: true
  },
  inner_image: {
    type: String,
    required: true
  }
}, { timestamps: true });

const NeighbourModel = mongoose.model('Neighbour', NeighbourSchema);
module.exports = NeighbourModel;
