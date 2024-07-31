// models/Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: false,
  },
});

const CompanyModel = mongoose.model('Company', CompanySchema);

module.exports = CompanyModel;
