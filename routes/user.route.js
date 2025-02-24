const express = require('express')
const FuelStation = require('../models/fuelstation.model');
const Order = require('../models/order.model');
const router = express.Router();


router.get('/',(req,res)=>{
    res.render('user/userhome');
})


router.get('/fuelstations', async (req, res) => {
    try {
        const FS = await  FuelStation.find(); // Use await
        res.render('user/fuelstations', { stations: FS }); // Pass correct variable
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


router.get("/my-orders", async (req, res) => {
    try {
        const customerId = req.session.userId; // Assuming user session exists
        const orders = await Order.find({ customerId }).sort({ createdAt: -1 }); // Fetch orders for the logged-in user
        res.render("user/my_orders", { orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
    }
});

//orders

router.get('/order/:id',async (req,res)=>{
    const id = req.params.id
    const FS = await FuelStation.findOne({_id:id})
    console.log(FS)
    res.render('user/order',{station:FS})
});

router.post("/submit-order", async (req, res) => {
    try {
        const { station, quantity, addressType, manualAddress, locationAddress, latitude, longitude, date, time } = req.body;

        // Validate required fields
        if (!station || !quantity || !date || !time || !addressType) {
            return res.status(400).send("Missing required fields");
        }

        // Ensure at least one address is provided
        if (addressType === "manual" && !manualAddress) {
            return res.status(400).send("Manual address is required");
        }
        if (addressType === "location" && (!locationAddress || !latitude || !longitude)) {
            return res.status(400).send("Location address, latitude, and longitude are required");
        }

        // Create new order
        const newOrder = new Order({
            station,
            quantity,
            addressType,
            manualAddress: addressType === "manual" ? manualAddress : null,
            locationAddress: addressType === "location" ? locationAddress : null,
            latitude: addressType === "location" ? latitude : null,
            longitude: addressType === "location" ? longitude : null,
            date,
            time
        });

        // Save order to database
        await newOrder.save();

        // Redirect or send success response
        res.redirect("/user/my-orders"); // Redirect to order list page (optional)
    } catch (error) {
        console.error("Error saving order:", error);
        res.status(500).send("Internal Server Error");
    }
});



module.exports = router;