const express = require('express')
const Users = require('../models/user.model')
const router = express.Router();


router.get('/',(req,res)=>{
    res.render('admin/adminhome');
})

router.get('/fuel_reg',(req,res)=>{
    res.render('admin/add_fuelstation')
})

router.get('/users', async (req, res) => {
    try {
        const users = await Users.find({ role: "customer" }); // Use await
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
        const users = await Users.find({ role: "fuel-station" }); // Use await
        res.render('admin/fuelstations', { user: users }); // Pass correct variable
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