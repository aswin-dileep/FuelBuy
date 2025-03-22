const express = require('express');
const Orders = require('../models/order.model');
const Fuelstations = require('../models/fuelstation.model');
const Driver = require('../models/driver.model');
const geolib = require('geolib');
const router = express.Router();

function isAuthenticated(req, res, next) {
    if (req.session.userId && req.session.role === 'Driver') {
        return next();
    }
    res.redirect('/login');
}

router.get('/',(req,res)=>{
    res.render('driver/driverhome');
})

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    return geolib.getDistance(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
    ) / 1000; // Convert meters to kilometers
}

router.get('/orders', async (req, res) => {
    try {
        const driverId = req.session.userId;

        // Fetch driver details
        const driver = await Driver.findOne({ userId: driverId }).populate('userId');
        if (!driver) {
            return res.status(404).send('Driver not found.');
        }

        // Fetch assigned orders
        const orders = await Orders.find({ assignedDriver: driver._id })
            .populate('userId', 'name')
            .populate('fuelId', 'type');

        // Render the orders page with the fetched orders
        res.render('driver/orders', { orders });
    } catch (err) {
        console.error('Error fetching assigned orders:', err);
        res.status(500).send('Server Error');
    }
});

// Route to display order details
router.get('/orders/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Orders.findById(orderId)
            .populate('userId', 'name address')
            .populate('fuelId', 'type');
        if (!order) {
            return res.status(404).send('Order not found.');
        }
        res.render('driver/orderDetails', { order });
    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).send('Server Error');
    }
});

// Route to update order status
router.put('/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['On the way', 'Delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).send('Invalid status.');
        }

        // Update order status
        const order = await Orders.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).send('Order not found.');
        }

        res.status(200).send('Order status updated successfully.');
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).send('Server Error');
    }
});

router.post("/update-order-status", async (req, res) => {
    try {
        const { orderId, status } = req.body; // Use "status" to match the form field name

        // Validate input
        if (!orderId || !status) {
            return res.status(400).json({ error: "Invalid request data." });
        }

        // Update order status
        const order = await Orders.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!order) {
            return res.status(404).json({ error: "Order not found." });
        }

        res.redirect("/driver/orders"); // Redirect to the previous page

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;