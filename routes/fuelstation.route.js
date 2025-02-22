const express = require('express')
const User = require('../models/user.model');
const driver = require('../models/driver.model');
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


router.get("/stock",(req,res)=>{
    res.render('fuelstation/stock_update')
})

module.exports = router;