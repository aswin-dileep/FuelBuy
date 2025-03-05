const express = require('express');
const Orders = require('../models/order.model');
const Fuelstations = require('../models/fuelstation.model');
const Driver = require('../models/driver.model');
const router = express.Router();


router.get('/',(req,res)=>{
    res.render('driver/driverhome');
})

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

router.get('/orders', async (req, res) => {
    try {
        // Check if the driver is logged in
        if (!req.session.userId) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        // Find the logged-in driver
        const driver = await Driver.findById(req.session.userId);
        if (!driver) {
            return res.status(404).send("Driver not found.");
        }

        // Get the fuel station details
        const fuelStation = await Fuelstations.findById(driver.fuelStationId);
        if (!fuelStation) {
            return res.status(404).send("Fuel station not found.");
        }

        // Fetch orders assigned to the driver's fuel station & populate customer details
        const orders = await Orders.find({ station: driver.fuelStationId })
            .populate("customer");

        // Add distance calculation for each order
        const ordersWithDistance = orders.map(order => {
            let distance = Number.MAX_VALUE; // Default to max value
            if (order.latitude && order.longitude && fuelStation.coordinates) {
                distance = calculateDistance(
                    fuelStation.coordinates.lat,
                    fuelStation.coordinates.lng,
                    order.latitude,
                    order.longitude
                );
            }
            return { ...order.toObject(), distance };
        });

        // 🔹 Sort orders by distance (Ascending order)
        ordersWithDistance.sort((a, b) => a.distance - b.distance);

        res.render("driver/orders", { orders: ordersWithDistance });

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
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