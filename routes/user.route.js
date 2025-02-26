const express = require('express')
const FuelStation = require('../models/fuelstation.model');
const Order = require('../models/order.model');
const router = express.Router();
require('dotenv').config();
const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY);

router.get('/',(req,res)=>{
    res.render('user/userhome',{session:req.session});
})


router.get('/fuelstations', async (req, res) => {
    try {
        const FS = await  FuelStation.find(); // Use await
        res.render('user/fuelstations', { stations: FS ,session:req.session}); // Pass correct variable
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
    res.render('user/order',{station:FS,session:req.session})
});

// Create Checkout Session and Store Order (Pending)
router.post("/create-checkout-session", async (req, res) => {
    try {
        const { station, quantity, totalPrice, addressType, manualAddress, locationAddress, latitude, longitude, date, time, customerId } = req.body;

        if (!station || !quantity || !date || !time || !addressType) {
            return res.status(400).send("Missing required fields");
        }

        if (addressType === "manual" && !manualAddress) {
            return res.status(400).send("Manual address is required");
        }

        if (addressType === "location" && (!locationAddress || !latitude || !longitude)) {
            return res.status(400).send("Location address, latitude, and longitude are required");
        }

        // Create a new order with status "Pending"
        const newOrder = new Order({
            customerId,
            station,
            quantity,
            totalPrice,
            addressType,
            manualAddress: addressType === "manual" ? manualAddress : null,
            locationAddress: addressType === "location" ? locationAddress : null,
            latitude: addressType === "location" ? latitude : null,
            longitude: addressType === "location" ? longitude : null,
            date,
            time,
            status: "Pending", // Initially set as pending
        });

        const savedOrder = await newOrder.save();

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: { name: `Fuel from ${station}` },
                        unit_amount: Math.round(totalPrice * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `http://localhost:5000/user/my-orders`,
            cancel_url: `http://localhost:5000/user/`,
            metadata: { orderId: String(savedOrder._id) }, // Attach order ID to Stripe session
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).send("Error processing payment");
    }
});

// Handle Payment Success
router.get("/payment-success", async (req, res) => {
    try {
        const { orderId } = req.query;
        if (!orderId) return res.status(400).send("Order ID is missing");

        // Update order status to "Paid"
        await Order.findByIdAndUpdate(orderId, { status: "Paid" });

        res.redirect("/user/my-orders"); // Redirect to user's order list
    } catch (error) {
        console.error("Payment success error:", error);
        res.status(500).send("Error updating order status");
    }
});

// Handle Payment Cancellation
router.get("/payment-cancel", async (req, res) => {
    try {
        const { orderId } = req.query;
        if (!orderId) return res.status(400).send("Order ID is missing");

        // Update order status to "Cancelled"
        await Order.findByIdAndUpdate(orderId, { status: "Cancelled" });

        res.redirect("/user"); // Redirect to home page
    } catch (error) {
        console.error("Payment cancel error:", error);
        res.status(500).send("Error updating order status");
    }
});

// Stripe Webhook (Optional for automatic verification)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const orderId = session.metadata.orderId;

            await Order.findByIdAndUpdate(orderId, { status: "Paid" });
        }

        res.json({ received: true });
    } catch (err) {
        console.error("Webhook error:", err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});


module.exports = router;