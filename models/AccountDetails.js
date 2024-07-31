const mongoose = require('mongoose');

const AccountDetailsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    profileImage: { type: String }
});

const AccountDetailsModel = mongoose.model('AccountDetails', AccountDetailsSchema);

module.exports = AccountDetailsModel;
