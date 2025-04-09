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

router.get('/', async (req, res) => {
    try {
        const driver = await Driver.findOne({userId:req.session.userId})
        const driverId =driver._id;  // Assuming you store the logged-in driver ID in `req.user`
        
        // Find the active order assigned to the driver
        const assignedOrder = await Orders.findOne({ assignedDriver: driverId, status: { $nin: ["Delivered", "Cancelled"] } });

        res.render('driver/driverhome', { assignedOrder });  // ✅ Pass assignedOrder to EJS
    } catch (error) {
        console.error("Error fetching assigned order:", error);
        res.status(500).send("Server Error");
    }
});

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

        // Fetch assigned orders that are not delivered
        const orders = await Orders.find({ 
                assignedDriver: driver._id, 
                status: { $ne: "Delivered" } // 👈 exclude delivered orders
            })
            .populate('userId', 'name')
            .populate('fuelId', 'type');

        // Render the orders page with the filtered orders
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
// Route to update order status via AJAX and reduce vehicle capacity if delivered
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

        // ✅ If delivered, reduce vehicle capacity
        if (status === 'Delivered') {
            const driver = await Driver.findOne({ userId: req.session.userId });
            if (!driver) {
                return res.status(401).send("Driver not found or unauthorized.");
            }

            const vehicle = await Vehicle.findOne({ driverId: driver._id });

            if (vehicle) {
                const newCapacity = vehicle.currentCapacity - order.quantity;
                vehicle.currentCapacity = newCapacity < 0 ? 0 : newCapacity;
                await vehicle.save();
                console.log("Vehicle capacity updated to:", vehicle.currentCapacity);
            } else {
                console.log("No vehicle assigned to driver.");
            }
        }

        res.status(200).send('Order status updated successfully.');
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).send('Server Error');
    }
});


router.post("/update-order-status", async (req, res) => {
    try {
        const { orderId, status } = req.body;
        cosole.log("This is working...")
        // Validate input
        if (!orderId || !status) {
            return res.status(400).json({ error: "Invalid request data." });
        }

        // Update order status
        const order = await Orders.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!order) {
            return res.status(404).json({ error: "Order not found." });
        }
        onsole.log(status)
        // If status is "Delivered", reduce vehicle's currentCapacity
        if (status === 'Delivered') {
            const driver = await Driver.findOne({ userId: req.session.userId });
            if (!driver) {
                return res.status(401).json({ error: "Driver not found or unauthorized." });
            }

            const vehicle = await Vehicle.findOne({ driverId: driver._id });
            console.log(vehicle)
            if (vehicle) {
                const newCapacity = vehicle.currentCapacity - order.quantity;
                vehicle.currentCapacity = newCapacity < 0 ? 0 : newCapacity; // Make sure it doesn't go negative
                await vehicle.save();
            }
        }

        res.redirect("/driver/orders");

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

        // 1. Find the driver
        const driver = await Driver.findOne({ userId: driverId });
        if (!driver) {
            console.log("❌ Driver not found for userId:", driverId);
            return res.status(404).send("Driver not found.");
        }

        // 2. Find the fuel station
        const fuelStation = await Fuelstations.findOne({ userId: driver.fuelStationId });
        if (!fuelStation) {
            console.log("⛽ Fuel station not found for ID:", driver.fuelStationId);
            return res.status(404).send("Associated fuel station not found.");
        }

        // 3. Find available vehicles
        const vehicles = await Vehicle.find({
            fuelStationId: fuelStation._id,
            status: "Available"
        });

        // 4. Find the vehicle occupied by this driver (if any)
        const myVehicle = await Vehicle.findOne({
            fuelStationId: fuelStation._id,
            status: "In Use",
            driverId: driver._id
        });

        res.render("driver/vehicles", { vehicles, myVehicle });

    } catch (error) {
        console.error("⚠️ Error fetching vehicles:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/my-vehicle", async (req, res) => {
    try {
        const driverId = req.session.userId;
        if (!driverId) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        // Find the driver and check their assigned vehicle
        const driver = await Driver.findOne({ userId: driverId });
        console.log(driver)
        if (!driver) {
            return res.redirect("/driver/vehicles"); // Redirect if no occupied vehicle
        }

        // Get vehicle details
        const myVehicle = await Vehicle.findOne({driverId:driver});
        if (!myVehicle) {
            return res.redirect("/driver/vehicles"); // Redirect if vehicle is missing
        }

        res.render("driver/my-vehicle", { myVehicle });

    } catch (error) {
        console.error("Error fetching my vehicle:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/my-vehicle/release", async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.session.userId });
        if (!driver) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        // Find the vehicle assigned to the driver
        const myVehicle = await Vehicle.findOne({ driverId: driver._id });
        if (!myVehicle) {
            return res.redirect("/driver/vehicles");
        }

        // Update vehicle status and remove driver association
        await Vehicle.findByIdAndUpdate(myVehicle._id, { 
            status: "Available", 
            driverId: null
        });

        // ✅ Update driver status to "Available"
        await Driver.findByIdAndUpdate(driver._id, { status: "Available" });

        res.redirect("/driver/vehicles");
    } catch (error) {
        console.error("Error releasing vehicle:", error);
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

        // Find the driver
        const driver = await Driver.findOne({ userId: driverId });

        if (!driver) {
            return res.status(404).send("Driver not found.");
        }

        // Check if the driver is already using a vehicle
        const assignedVehicle = await Vehicle.findOne({ fuelStationId: driver.fuelStationId, status: "In Use" });

        if (assignedVehicle) {
            return res.status(400).send("You are already assigned to a vehicle.");
        }

        // Assign vehicle to driver and update driver status
        await Vehicle.findByIdAndUpdate(vehicleId, { status: "In Use", driverId: driver._id });
        await Driver.findByIdAndUpdate(driver._id, { status: "on Duty" }); // Change driver status

        res.redirect("/driver/vehicles");

    } catch (error) {
        console.error("Error occupying vehicle:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.post("/update-location", async (req, res) => {
    const { orderId, latitude, longitude } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });

        // Update the delivery vehicle's location
        order.currentLocation = { latitude, longitude };
        await order.save();

        // Emit the updated location to clients
        io.emit(`locationUpdate-${orderId}`, { latitude, longitude });

        res.status(200).json({ message: "Location updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});



module.exports = router;