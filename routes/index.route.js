const express = require("express");
const User = require('../models/user.model');
const FuelStation = require('../models/fuelstation.model');
const Driver = require('../models/driver.model');
const Customer = require('../models/customer.model');
const bcrypt = require('bcrypt');
const session = require('express-session');

const router = express.Router();

// Setup session middleware (move this to app.js if not done)
router.use(session({
    secret: 'yourSecretKey', // Change to a secure key
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Home Page
router.get('/', (req, res) => {
    res.render("index", { title: "FuelBuy" });
});

// Login Page
router.get('/login', (req, res) => {
    res.render('login');
});

// Handle Login Request
router.post('/login', async (req, res) => {
    try {
        const email = req.body.username;
        const password =  req.body.password;

        // Check in User model (Admin, Driver, Customer)
        let user = await User.findOne({ email });

        // If user still not found, return error
        if (!user) {
            res.render('/error',{ message: "User not found" })
        }

        // Compare hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.send("Wrong password");
        }

        // Store user details in session
        req.session.userId = user._id;
        req.session.email = user.email;
        req.session.role = user.role;
        console.log(req.session);
        // Determine user role & redirect accordingly
        if(user.role=='admin'){
            res.redirect('/admin')
        }else if(user.role=='user'){
            res.redirect('/user')
        }else if(user.role=='driver'){
            res.redirect('/driver')
        }else{
            res.redirect('/fuelstation')
        }
       

    } catch (error) {
        console.error(error);
        res.send("Something went wrong, please try again");
    }
});


// Signup Page
router.get('/sign-up', (req, res) => {
    res.render('signup');
});

// Handle Signup Request
router.post('/sign-up', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const role = 'user';
        // Check if the customer already exists
        const userExist = await User.findOne({ email });

        if (userExist) {
            return res.status(400).send("<h1>User already exists</h1>");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new customer
        const newUser = new User({
            name,
            email,
            phone,
            role,
            password: hashedPassword
        });

        await newUser.save();

        res.redirect('/login'); // Redirect to login page after successful sign-up

    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating customer. Please try again.");
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Logout failed');
        }
        res.redirect('/login');
    });
});

module.exports = router;
