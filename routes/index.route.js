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

        // If not found, check in FuelStation model
        if (!user) {
            user = await FuelStation.findOne({ email });
        }
        // if not found, check in driver model
        if(!user){
            user = await Driver.findOne({email})
        }

        // if not found, check in customer model
        if(!user){
            user = await Customer.findOne({email})
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
        }else if (user instanceof Driver){
            req.session.role = "Driver";
            req.session.name = user.name;
            return res.redirect("/driver");
        }else{
            req.session.role = "Customer";
            req.session.name = user.name;
            return res.redirect("/user")
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
        const { name, email, phone, password } = req.body;

        // Check if the customer already exists
        const customerExist = await Customer.findOne({ email });

        if (customerExist) {
            return res.status(400).send("<h1>Customer already exists</h1>");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new customer
        const newCustomer = new Customer({
            name,
            email,
            phone,
            password: hashedPassword
        });

        await newCustomer.save();

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
