
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String },
    phone: { type: String },
    address: { type: String },
    profileImage: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
