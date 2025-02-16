const { name } = require('ejs')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },

    email: { type: String, unique: true, required: true },

    phone:{ type: Number},

    password: { type: String, required: true },

    fuelStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: function () { return this.role === 'driver'; } }, // Only for Drivers
    
    location: { type: String }, // Only for Fuel Stations & Drivers
    
    vehicleCapacity: { type: String }, // Only for Drivers
    
}, { timestamps: true });

const userModel = new mongoose.model('user',userSchema);

module.exports = userModel;