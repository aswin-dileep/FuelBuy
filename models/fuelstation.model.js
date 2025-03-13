const mongoose = require("mongoose");

const FuelstationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Ensure correct reference
    location: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const FuelStation = mongoose.model("FuelStation", FuelstationSchema);

module.exports = FuelStation;