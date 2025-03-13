const express = require('express')
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const Order = require('../models/order.model');
const Fuelstations = require('../models/fuelstation.model');
const Fuel = require('../models/fuel.model');
const bcrypt = require('bcrypt');
const FuelStation = require('../models/fuelstation.model');
const router = express.Router();


router.get('/',(req,res)=>{
    res.render('fuelstation/fuelstationhome',{ user: req.session });
})

router.get('/driver_reg',(req,res)=>{
    
    res.render('fuelstation/add_driver', {user: req.session})
})

router.post('/driver_reg',async(req,res)=>{
    try {
        console.log("Received data:", req.body);

        // Check if user already exists
        const userExist = await User.findOne({ email: req.body.email });
        if (userExist) {
            return res.status(400).send("<h1>User already exists</h1>");
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create New User
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            role: 'driver',
            password: hashedPassword
        });

        await newUser.save();

        // Ensure req.session.userId contains a valid fuel station ID
        if (!req.session.userId) {
            return res.status(400).send("Fuel Station ID is missing from session.");
        }

        // Create Driver entry
        const newDriver = new Driver({
            userId: newUser._id,
            fuelStationId: req.session.userId,  // Make sure session contains correct ID
            licenceNo: req.body.licenceNo,
            aadharNo: req.body.aadharNo
        });

        await newDriver.save(); // Missing 'await' fixed

        res.redirect('/fuelstation');
    } catch (error) {
        console.error("Error registering driver:", error);
        res.status(500).send("Internal Server Error");
    }
})

router.get('/drivers', async(req,res)=>{
    try {
        // Ensure user is authenticated and session contains fuelStationId
        if (!req.session.userId) {
            res.redirect('/login')
            
        }

        // Fetch drivers associated with the logged-in fuel station
        const drivers = await Driver.find({ fuelStationId: req.session.userId }).populate('userId');

        res.render("fuelstation/drivers", { drivers });
    } catch (err) {
        console.error("Error fetching drivers:", err);
        res.status(500).send("Internal Server Error");
    }
})


router.get("/:id/stock",async(req,res)=>{
        
        try {
            const fuel = await Fuel.findOne({_id:req.params.id});
            
            res.render('fuelstation/stock_update', { fuel });
        } catch (error) {
            console.error(error);
            res.status(500).send("Server error");
        }

})

// Route to update fuel stock and price
router.post("/update_stock", async (req, res) => {
    try {
        const { fuelId, quantity, price } = req.body;

        // Validate input
        if (!fuelId || !quantity || !price || quantity <= 0 || price <= 0) {
            return res.status(400).send("Invalid stock or price values.");
        }

        // Update fuel data
        await Fuel.findByIdAndUpdate(fuelId, { quantity, price });

        res.redirect("/fuelstation/fuels"); // Redirect to the fuels listing page
    } catch (err) {
        console.error("Error updating fuel stock:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/:id/delete", async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the fuel entry
        const fuel = await Fuel.findById(id);
        if (!fuel) {
            return res.status(404).send("Fuel not found");
        }

        await Fuel.findByIdAndDelete(id);

        res.redirect("/fuelstation/fuels"); // Redirect back to the fuels listing page
    } catch (err) {
        console.error("Error deleting fuel:", err);
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

// GET Route - Show Edit Driver Form
router.get('/drivers/:id/edit', async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id).populate('userId');
        if (!driver) {
            return res.status(404).send('Driver not found');
        }
        res.render('fuelstation/edit_driver', { driver });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// POST Route - Update Driver Details
router.post('/drivers/:id/edit', async (req, res) => {
    try {
        const { name, email, phone, aadharNo, licenceNo, password } = req.body;

        // Find the driver
        const driver = await Driver.findById(req.params.id).populate('userId');
        if (!driver) {
            return res.status(404).send('Driver not found');
        }

        // Update User Details
        const user = await User.findById(driver.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        user.name = name;
        user.email = email;
        user.phone = phone;
        
        if (password) {
            user.password = await bcrypt.hash(password, 10); // Hash password
        }

        await user.save();

        // Update Driver Details
        driver.aadharNo = aadharNo;
        driver.licenceNo = licenceNo;
        await driver.save();

        res.redirect('/fuelstation/drivers'); // Redirect to drivers list
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

//GET Route - for fuels 
router.get('/fuels',async (req,res)=>{
    const fuelstation = await FuelStation.findOne({userId:req.session.userId})
    const fuels = await Fuel.find({fuelStationId:fuelstation._id})
    console.log(fuels)
    res.render('fuelstation/fuels',{fuels})
})

// Render Add Fuel Page
router.get("/add_fuel",async (req, res) => {
    const fuelstation = await FuelStation.findOne({userId:req.session.userId})
    res.render("fuelstation/add_fuel", { fuelstation });
});

// Handle Fuel Submission
router.post("/add_fuel", async (req, res) => {
    try {
        const { type, quantity, price, fuelStationId } = req.body;

        // Create and Save Fuel
        const newFuel = new Fuel({ type, quantity, price, fuelStationId });
        await newFuel.save();

        res.redirect("/fuelstation/fuels");
    } catch (error) {
        console.error(error);
        res.redirect("/fuelstation/add_fuel");
    }
});

module.exports = router;