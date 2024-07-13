const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  applicationAmount: {
    type: Number,
    required: true
  },
  profilePicture: {
    type: String,
    required: true
  },
  markSheet: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);
