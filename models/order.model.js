const mongoose = require('mongoose');

const OrdersSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fuelStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fuelstation', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    addressType: { type: String, required: true },
    manualAddress: { type: String, required: true },
    locationAddress: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    date: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrdersSchema);

module.exports = Order;
