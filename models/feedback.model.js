const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fuelStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fuelstation', required: true },
    feedback: { type: String, required: true }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

module.exports = Feedback;