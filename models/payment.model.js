const { name } = require('ejs')
const mongoose = require('mongoose')

const PaymentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, 
    status: { type: String, required: true },
    cardNumber: { type: String, required: true }, 
    token: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true }
});

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;