const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    station: {
        type: mongoose.Schema.Types.ObjectId, // Reference to Customer model
        ref: 'FuelStation',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 20
    },
    addressType: {
        type: String,
        enum: ['manual', 'location'],
        required: true
    },
    manualAddress: {
        type: String,
        required: function() {
            return this.addressType === 'manual';
        }
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId, // Reference to Customer model
        ref: 'Customer',
        required: true
    },
    totalPrice:{
        type:Number
    },
    locationAddress: {
        type: String
    },
    latitude: {
        type: Number,
        required: function() {
            return this.addressType === 'location';
        }
    },
    longitude: {
        type: Number,
        required: function() {
            return this.addressType === 'location';
        }
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String, // Storing time as 'HH:mm'
        required: true
    },
    status:{
        type:String,
        default:"Pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
