const { name } = require('ejs')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },

    email: { type: String, unique: true, required: true },

    password: { type: String, required: true },

    role: { type: String, enum: ['Admin', 'FuelStation', 'DeliveryDriver', 'Customer'], required: true },

    fuelStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: function () { return this.role === 'DeliveryDriver'; } }, // Only for Drivers
    
    location: { type: String }, // Only for Fuel Stations & Drivers
    
    vehicleDetails: { type: String }, // Only for Drivers
    
    fuelStationDetails: { type: String }, // Only for Fuel Stations
}, { timestamps: true });

const userModel = new mongoose.model('user',userSchema);

module.exports = userModel;