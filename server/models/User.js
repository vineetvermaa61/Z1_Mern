// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  twitterId: { type: String, required: true },
  username: { type: String },
  displayName: { type: String },
  token: { type: String },
  tokenSecret: { type: String },
});

module.exports = mongoose.model('User', UserSchema);
