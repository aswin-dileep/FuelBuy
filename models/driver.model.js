const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fuelStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'FuelStation', required: true },
    licenceNo: { type: String, required: true, trim: true },
    aadharNo: { type: String, required: true, trim: true },
}, { timestamps: true }); // Automatically manages createdAt and updatedAt

const driver = mongoose.model('Driver', DriverSchema);
module.exports = driver;
