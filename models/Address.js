const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true  },
    address: { type: String, required: true  },
    city: { type: String, required: true  },
    state: { type: String, required: true },
    country: { type: String, required: true  },
    zip: { type: String, required: true  },
});

const AddressModel = mongoose.model('Address', AddressSchema);

module.exports = AddressModel;
