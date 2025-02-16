const mongoose = require("mongoose");

const fuelStationSchema = new mongoose.Schema({
    stationName: String,
    email: String,
    phone: String,
    location: String,
    password: String,
    coordinates: {
        lat: Number,
        lng: Number
    }
},{ timestamps: true });

const FuelStation = mongoose.model("FuelStation", fuelStationSchema);

module.exports = FuelStation;
