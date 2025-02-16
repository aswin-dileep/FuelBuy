const express = require("express");
const User = require('../models/user.model');
const FuelStation = require('../models/fuelstation.model');
const driver = require('../models/driver.model');
const customer = require('../models/customer.model');
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

        // If not found, check in FuelStation model
        if (!user) {
            user = await FuelStation.findOne({ email });
        }

        // If user still not found, return error
        if (!user) {
            return res.send("Username not found");
        }

        // Compare hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.send("Wrong password");
        }

        // Store user details in session
        req.session.userId = user._id;
        req.session.email = user.email;
        
        console.log(req.session);
        // Determine user role & redirect accordingly
        if (user instanceof User) {
            req.session.role = "Admin";
            req.session.name = user.name;
                return res.redirect('/admin');
            
        } else if (user instanceof FuelStation) {
            req.session.role = "FuelStation";
            req.session.name = user.stationName;
            return res.redirect("/fuelstation");
        }
       
        // If role is somehow unknown, return an error
        return res.send("Invalid user role");

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
        // Check if user already exists
        const userExist = await User.findOne({ email: req.body.email });

        if (userExist) {
            return res.send("<h1>User already exists</h1>");
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create New User
        const newUser = new User({
            name: req.body.name,
            role: req.body.role,
            email: req.body.email,
            phone: req.body.phone,
            password: hashedPassword
        });

        await newUser.save();

        res.redirect('/login'); // Redirect to login after signup
    } catch (error) {
        console.error(error);
        res.send("Error creating user. Please try again.");
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
