const express = require('express');
const Orders = require('../models/order.model');
const Fuelstations = require('../models/fuelstation.model');
const Driver = require('../models/driver.model');
const Vehicle = require('../models/vehicle.model');
const geolib = require('geolib');
const router = express.Router();
const mongoose = require("mongoose");
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

// Vehicles Page - Show Available Vehicles
router.get("/vehicles", async (req, res) => {
    try {
        const driverId = req.session.userId;
        if (!driverId) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        // 1. Find the driver FIRST
        const driver = await Driver.findOne({ userId: driverId });
        if (!driver) {
            console.log("❌ Driver not found for userId:", driverId);
            return res.status(404).send("Driver not found.");
        }

        // 2. Then find the fuel station
        const fuelStation = await Fuelstations.findOne({ userId: driver.fuelStationId });
        if (!fuelStation) {
            console.log("⛽ Fuel station not found for ID:", driver.fuelStationId);
            return res.status(404).send("Associated fuel station not found.");
        }

        console.log(fuelStation._id)

        // 3. Find vehicles (no need for ObjectId conversion)
        const vehicles = await Vehicle.find({
            fuelStationId: fuelStation._id,
            status: "Available"
        });

        res.render("driver/vehicles", { vehicles });

    } catch (error) {
        console.error("⚠️ Error fetching vehicles:", error);
        res.status(500).send("Internal Server Error");
    }
});




// Occupy Vehicle - Driver Assigns a Vehicle
router.post("/vehicles/occupy/:vehicleId", async (req, res) => {
    try {
        const driverId = req.session.userId;
        const vehicleId = req.params.vehicleId;

        if (!driverId) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        // Check if the driver is already using a vehicle
        const driver = await Driver.findOne({ userId: driverId });

        if (!driver) {
            return res.status(404).send("Driver not found.");
        }

        const assignedVehicle = await Vehicle.findOne({ fuelStationId: driver.fuelStationId, status: "In Use" });

        if (assignedVehicle) {
            return res.status(400).send("You are already assigned to a vehicle.");
        }

        // Assign vehicle to driver
        await Vehicle.findByIdAndUpdate(vehicleId, { status: "In Use" });

        res.redirect("/driver/vehicles");

    } catch (error) {
        console.error("Error occupying vehicle:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;