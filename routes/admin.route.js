const express = require('express')
const Users = require('../models/user.model')
const FuelStation = require('../models/fuelstation.model');
const Customer = require('../models/customer.model')
const bcrypt = require('bcrypt');
const router = express.Router();


router.get('/',(req,res)=>{
    res.render('admin/adminhome');
})

router.get('/fuel_reg',(req,res)=>{
    res.render('admin/add_fuelstation')
})

router.post("/fuel_reg", async (req, res) => {
    try {
        console.log("Received data:", req.body);

        const { stationName, email, phone, location, latitude, longitude, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        if (!stationName || !email || !phone || !location || !latitude || !longitude || !password) {
            return res.status(400).send("All fields are required!");
        }

        const existingStation = await FuelStation.findOne({ email });
        if (existingStation) {
            return res.status(400).send("Fuel station with this email already exists!");
        }

        const newStation = new FuelStation({ 
            stationName, 
            email, 
            phone, 
            location,
            password:hashedPassword, 
            coordinates: { lat: latitude, lng: longitude } // Store coordinates
        });

        await newStation.save();
        res.redirect("/admin/fuelstations");
    } catch (error) {
        console.error("Error registering fuel station:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get('/users', async (req, res) => {
    try {
        const users = await Customer.find(); // Use await
        res.render('admin/users', { user: users }); // Pass correct variable
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post('/users',async (req,res)=>{
       res.render('')
})

router.get('/users/:id', async (req, res) => {
    try {
        const user = await Users.findById(req.params.id); // Get ID from URL
        if (!user) {
            return res.status(404).send("User not found");
        }
        console.log("hello")
        res.render('admin/userDetails', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post('/users/:id/delete', async (req, res) => {
    try {
        await Users.findByIdAndDelete(req.params.id);
        res.redirect('/users'); // Redirect to users list after deleting
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


router.get('/fuelstations', async (req, res) => {
    try {
        const FS = await  FuelStation.find(); // Use await
        res.render('admin/fuelstations', { stations: FS }); // Pass correct variable
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


router.post('/users/:id/delete', async (req, res) => {
    try {
        await Users.findByIdAndDelete(req.params.id);
        res.redirect('/fuelstations'); // Redirect to users list after deleting
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});




module.exports = router;