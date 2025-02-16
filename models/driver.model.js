const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: Number },
    password: { type: String, required: true },
    fuelStationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'FuelStation', 
        required: function () { return this.fuelStationId !== null; } // Optional, only required if not null
    },
    vehicleCapacity: { type: String }, 
}, { timestamps: true });

const driverModel = mongoose.model('Driver', driverSchema);
module.exports = driverModel;
