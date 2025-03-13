const express = require('express')
const Users = require('../models/user.model')
const FuelStation = require('../models/fuelstation.model');
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
        console.log("received data:",req.body);
        const { stationName,email,phone,location,latitude,longitude,password }= req.body;
        
        if (!stationName || !email || !phone || !location || !latitude || !longitude || !password) {
            return res.status(400).send("All fields are required!");
        }

        const existUser = FuelStation.findOne({email:email});
        console.log(existUser)

        if(existUser){
            return res.status(400).send("User already exist");
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const newUser = new Users({
            name:stationName,
            phone,
            email,
            password:hashedPassword,
            role:'fuelstation'
        })

        await newUser.save();

        //creating in fuelstation table
        const newFuelstation =  new FuelStation({
            userId:newUser._id,
            location,
            latitude,
            longitude
        });

        await newFuelstation.save();

        res.redirect('/admin/fuelstations');

    } catch (error) {
        console.error("Error registering fuel station:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await Users.find({role:'user'}); // Use await
        res.render('admin/users', { user: users }); // Pass correct variable
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


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
        const fuelStations = await FuelStation.find().populate('userId').exec();

        res.render('admin/fuelstations', { stations: fuelStations });
    } catch (err) {
        console.error("Error fetching fuel stations:", err);
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