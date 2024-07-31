const mongoose = require("mongoose");

const CheckoutSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    componyName: String,
    componyAddress: String,
    address: String,
    country: String,
    city: String,
    state: String,
    zip: String,
    message: String,
    itemDetails: [{
      itemId: String,
      price: Number,
    }],
    totalPrice: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("checkout", CheckoutSchema);
