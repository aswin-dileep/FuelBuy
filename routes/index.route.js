const express = require("express");
const User = require('../models/user.model');
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
router.post('/login', async(req,res)=> {
    try {
        const check = await User.findOne({ email: req.body.username });

        if (!check) {
            return res.send("Username not found");
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);

        if (isPasswordMatch) {
            // Store user details in session
            req.session.userId = check._id; 
            req.session.email = check.email;
            req.session.role = check.role;

            // Redirect based on role
            if (check.role == "admin") {
                return res.redirect('/admin');
            } else if (check.role == "customer") {
                return res.redirect("/user");
            } else if (check.role == "fuel-station") {
                return res.redirect("/fuelstation");
            } else {
                return res.redirect("/driver");
            }
        } else {
            res.send("Wrong password");
        }
    } catch (error) {
        console.log(error);
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
