const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    fuelStationId: { type: mongoose.Schema.Types.ObjectId, ref: "FuelStation", required: true },
    capacity: { type: Number, required: true },
    currentCapacity:{type:Number,default:0},
    plateNumber: { type: String, unique: true, required: true },
    status: { type: String, enum: ["Available", "In Use"], default: "Available" },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null } // Reference to Driver model
}, { timestamps: true });
const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;