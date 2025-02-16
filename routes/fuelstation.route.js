const express = require('express')
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const router = express.Router();


router.get('/',(req,res)=>{
    res.render('fuelstation/fuelstationhome',{ user: req.session });
})

router.get('/driver_reg',(req,res)=>{
    
    res.render('fuelstation/add_driver', {user: req.session})
})

router.post('/driver_reg',async(req,res)=>{
    const userExist = await User.findOne({ email: req.body.email });

        if (userExist) {
            return res.send("<h1>User already exists</h1>");
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create New User
        const newUser = new User({
            name: req.body.name,
            role: 'Driver',
            email: req.body.email,
            phone: req.body.phone,
            fuelStationId: req.body.stationId,
            vehicleCapacity:req.body.Capacity,
            password: hashedPassword
        });

        await newUser.save();
        res.redirect('/fuel-station');
})

module.exports = router;