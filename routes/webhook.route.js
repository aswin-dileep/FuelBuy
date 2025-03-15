const express = require('express')
const FuelStation = require('../models/fuelstation.model');
const Order = require('../models/order.model');
const Fuel = require('../models/fuel.model');
const Payment = require('../models/payment.model');
const router = express.Router();
require('dotenv').config();
const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY);


// Create Checkout Session and Store Order (Pending)
router.post("/create-checkout-session", async (req, res) => {
    try {
        const { fuelId, quantity, totalPrice, addressType, manualAddress, locationAddress, latitude, longitude, date, time, customer } = req.body;

        const fuel = await Fuel.findById(fuelId).populate("fuelStationId");

        const order = new Order({
            userId: customer,
            fuelId,
            fuelStationId: fuel.fuelStationId,  // Get station from fuel
            quantity,
            totalPrice,
            addressType,
            manualAddress,
            locationAddress,
            latitude,
            longitude,
            date
        });

        await order.save();

        const updateQuantity = await Fuel.findByIdAndUpdate({_id:fuelId},{$inc:{quantity:-quantity}});

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "inr",
                    product_data: { name: "Fuel Order" },
                    unit_amount: Math.round(totalPrice * 100)
                },
                quantity: 1
            }],
            mode: "payment",
            customer_email: req.session.email,
            billing_address_collection: "required",
            success_url: `${req.protocol}://${req.get("host")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get("host")}/payment-failed`,
            metadata: { orderId: order._id.toString() } // ✅ Store orderId inside metadata
        });

        res.json({ id: session.id });
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
});

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("⚠️ Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("🔥 Webhook Event Data:", JSON.stringify(event, null, 2));

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        console.log("✅ Stripe Session:", session);

        // ✅ Get orderId from metadata
        const orderId = session.metadata?.orderId;
        if (!orderId) {
            console.error("❌ Order ID missing in session metadata!");
            return res.status(400).json({ error: "Order ID missing in metadata" });
        }

        // ✅ Find the order in database
        const order = await Order.findById(orderId);
        if (!order) {
            console.error("❌ Order not found for ID:", orderId);
            return res.status(404).json({ error: "Order not found" });
        }

        // ✅ Fetch Payment Details Properly
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        const last4 = paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4 || "Unknown";

        // ✅ Store payment details in MongoDB
        const payment = new Payment({
            orderId: order._id,
            status: "Paid",
            cardNumber: `XXXX-XXXX-XXXX-${last4}`,
            token: session.id, // Stripe session ID as token
            name: session.customer_details?.name || "Unknown",
            email: session.customer_email || "Unknown"
        });

        await payment.save();

        // ✅ Update Order status to "Paid"
        await Order.findByIdAndUpdate(order._id, { status: "Paid" });

        console.log("✅ Payment saved & Order updated!");
    }

    res.json({ received: true });
});

module.exports = router;