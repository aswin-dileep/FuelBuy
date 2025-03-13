const mongoose = require('mongoose')

const FuelSchema = new mongoose.Schema({
    type: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    fuelStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fuelstation', required: true }
});

const Fuel = new mongoose.model('Fuel',FuelSchema);

module.exports=Fuel;