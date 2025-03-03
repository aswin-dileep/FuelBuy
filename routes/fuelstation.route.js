const express = require('express')
const User = require('../models/user.model');
const driver = require('../models/driver.model');
const Order = require('../models/order.model');
const Fuelstations = require('../models/fuelstation.model');
const bcrypt = require('bcrypt');
const router = express.Router();


router.get('/',(req,res)=>{
    res.render('fuelstation/fuelstationhome',{ user: req.session });
})

router.get('/driver_reg',(req,res)=>{
    
    res.render('fuelstation/add_driver', {user: req.session})
})

router.post('/driver_reg',async(req,res)=>{
    const userExist = await driver.findOne({ email: req.body.email });

        if (userExist) {
            return res.send("<h1>User already exists</h1>");
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create New User
        const newDriver = new driver({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            fuelStationId: req.body.fuelStationId,
            vehicleCapacity:req.body.Capacity,
            password: hashedPassword
        });

        await newDriver.save();
        res.redirect('/fuelstation');
})

router.get('/drivers', async(req,res)=>{
    try {
        // Ensure user is authenticated and session contains fuelStationId
        if (!req.session.userId) {
            return res.status(401).send("Unauthorized Access");
        }

        // Fetch drivers associated with the logged-in fuel station
        const drivers = await driver.find({ fuelStationId: req.session.userId });

        res.render("fuelstation/drivers", { drivers });
    } catch (err) {
        console.error("Error fetching drivers:", err);
        res.status(500).send("Internal Server Error");
    }
})


router.get("/stock",async(req,res)=>{
    
        const fuelstationId = req.session.userId;
        
        try {
            const fs = await Fuelstations.findById(fuelstationId);
            if (!fs) {
                return res.status(404).send("Fuel station not found");
            }
            
            res.render('fuelstation/stock_update', { fuelstation: fs });
        } catch (error) {
            console.error(error);
            res.status(500).send("Server error");
        }

})

// Route to update fuel stock and price
router.post("/update_stock", async (req, res) => {
    try {
        const { fuel, fuelPrice } = req.body;

        // Validate input
        if (!fuel || !fuelPrice || fuel <= 0 || fuelPrice <= 0) {
            return res.status(400).send("Invalid stock or price values.");
        }

        // Update fuel station data
        await Fuelstations.findByIdAndUpdate(req.session.userId, {
            fuel,
            fuelPrice
        });

        res.redirect("/fuelstation/stock"); // Redirect back to the update page
    } catch (err) {
        console.error("Error updating fuel station:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Function to calculate distance using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const toRadians = (degree) => (degree * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

router.get("/orders", async (req, res) => {
    try {
        const fuelstationId = req.session.userId;

        if (!fuelstationId) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        // Find the fuel station
        const fuelStation = await Fuelstations.findById(fuelstationId);
        if (!fuelStation) {
            return res.status(404).send("Fuel station not found.");
        }

        // Fetch orders for this fuel station
        let orders = await Order.find({ station: fuelStation.stationName });

        // Calculate distance for each order dynamically
        orders = orders.map(order => {
            let distance = "N/A"; // Default value

            if (order.addressType === "location" && order.latitude && order.longitude) {
                distance = calculateDistance(
                    fuelStation.coordinates.lat, fuelStation.coordinates.lng,
                    order.latitude, order.longitude
                ).toFixed(2); // Round to 2 decimal places
            }

            return { ...order.toObject(), distance }; // Convert Mongoose object to plain object & add distance
        });

        res.render("fuelstation/orders", { orders });

    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;