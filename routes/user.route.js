const express = require('express')
const FuelStation = require('../models/fuelstation.model');
const Order = require('../models/order.model');
const Fuel = require('../models/fuel.model');
const Driver = require('../models/driver.model');
const Payment = require('../models/payment.model');
const Vehicle = require('../models/vehicle.model');
const Feedback = require('../models/feedback.model');
const User = require("../models/user.model");
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const router = express.Router();
require('dotenv').config();
const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY);

router.get('/', (req, res) => {
    res.render('user/userhome', { session: req.session });
})
// Haversine formula to calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const toRad = (degree) => degree * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
}

router.get('/fuelstations', async (req, res) => {
    try {
        console.log("Query Params: ", req.query); // ✅ Debugging

        const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
        const userLng = req.query.lng ? parseFloat(req.query.lng) : null;

        console.log("Extracted Lat: ", userLat, "Lng: ", userLng); // ✅ Debugging

        if (!userLat || !userLng) {
            console.log("User location not provided");
            return res.render('user/fuelstations', { stations: [], session: req.session });
        }

        const fuelStations = await FuelStation.find({}, 'location latitude longitude').populate('userId');

        let nearbyStations = fuelStations.map(station => {
            if (station.latitude && station.longitude) {
                station = station.toObject();
                station.distance = getDistance(userLat, userLng, station.latitude, station.longitude).toFixed(2);
            } else {
                station.distance = "N/A";
            }
            return station;
        });

        nearbyStations = nearbyStations
            .filter(station => station.distance !== "N/A" && station.distance <= 100)
            .sort((a, b) => a.distance - b.distance);

        res.render('user/fuelstations', { stations: nearbyStations, session: req.session });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


router.get('/fuelstation/:id/fuels', async (req, res) => {
    try {
        const fuelStationId = req.params.id;
        const fuelStation = await FuelStation.findById(fuelStationId);
        const fuels = await Fuel.find({ fuelStationId });

        if (!fuelStation) {
            return res.status(404).send("Fuel Station not found");
        }

        res.render('user/viewfuels', { station: fuelStation, fuels: fuels, session: req.session });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


router.get("/my-orders", async (req, res) => {
    try {
        const customerId = req.session.userId;
        if (!customerId) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        // 🔹 Get pagination values from query parameters
        let page = parseInt(req.query.page) || 1;  // Default to page 1
        let limit = parseInt(req.query.limit) || 5; // Default to 5 orders per page

        // Ensure page and limit are positive numbers
        if (page < 1) page = 1;
        if (limit < 1) limit = 5;

        const skip = (page - 1) * limit;

        // 🔹 Get total order count
        const totalOrders = await Order.countDocuments({ userId: customerId });

        // Calculate total pages (at least 1)
        const totalPages = Math.max(1, Math.ceil(totalOrders / limit));

        // Ensure page does not exceed totalPages
        if (page > totalPages) page = totalPages;

        // 🔹 Fetch paginated orders sorted by newest first
        const orders = await Order.find({ userId: customerId })
            .populate({
                path: 'fuelStationId',
                populate: {
                    path: 'userId',
                    model: 'User'
                }
            })
            .sort({ createdAt: -1 }) // Newest orders first
            .skip(skip)
            .limit(limit);

        res.render("user/my_orders", {
            orders,
            currentPage: page,
            totalPages,
            limit
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/order-details/:orderId", async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Fetch order details from the database
        const order = await Order.findById(orderId)
            .populate({
                path: 'fuelStationId',
                populate: {
                    path: 'userId',
                    model: 'User'
                }
            });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        res.render("user/order_details", { order });

    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).send("Internal Server Error");
    }
});

//orders

router.get('/order/:fuelId', async (req, res) => {
    try {
        const fuelId = req.params.fuelId;
        const fuel = await Fuel.findById(fuelId)
            .populate({
                path: "fuelStationId",
                populate: { path: "userId" } // Ensure userId is populated within fuelStationId
            });

        if (!fuel) {
            return res.status(404).send("Fuel not found");
        }

        res.render('user/order', { fuel, session: req.session });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Create Checkout Session and Store Order (Pending)
router.post("/create-checkout-session", async (req, res) => {
    try {
        const { fuelId, quantity, totalPrice, addressType, manualAddress, locationAddress, latitude, longitude, date, customer } = req.body;

        // Validate required fields
        if (!fuelId || !quantity || !totalPrice || !customer) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const fuel = await Fuel.findById(fuelId).populate("fuelStationId");
        if (!fuel) return res.status(404).json({ error: "Fuel not found" });

        // Create order
        const order = new Order({
            userId: customer,
            fuelId,
            fuelStationId: fuel.fuelStationId,
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

        // Store order ID in session for later validation
        req.session.orderId = order._id.toString();

        // Update fuel stock
        await Fuel.findByIdAndUpdate(fuelId, { $inc: { quantity: -quantity } });

        // Create Stripe checkout session
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
            success_url: `${req.protocol}://${req.get("host")}/user/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get("host")}/payment-failed`,
            metadata: { orderId: order._id.toString() } // ✅ Ensure orderId is stored
        });

        res.json({ id: session.id });

    } catch (error) {
        console.error("Checkout session error:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
});

// Handle Payment Success
router.get("/payment-success", async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id) return res.status(400).send("Missing session ID");

        // Retrieve Stripe session
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (!session.metadata || !session.metadata.orderId) {
            return res.status(400).send("Invalid session metadata");
        }

        const orderId = session.metadata.orderId;

        // Verify session order matches stored session order
        if (!req.session.orderId || req.session.orderId !== orderId) {
            return res.status(403).send("Unauthorized or Invalid Order");
        }

        // Retrieve payment intent to get charge details
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).send("Payment not successful yet");
        }

        // Retrieve the latest charge using the latest_charge property
        const chargeId = paymentIntent.latest_charge;
        const charge = await stripe.charges.retrieve(chargeId);

        // Get order details
        const order = await Order.findById(orderId)
            .populate('fuelStationId')
            .populate('fuelId');

        if (!order) return res.status(404).send("Order not found");

        // Extract card details (last 4 digits)
        const cardDetails = charge.payment_method_details?.card || {};
        const cardLast4 = cardDetails.last4 || "XXXX"; // Default if missing

        // Store payment details in the database
        const payment = new Payment({
            orderId,
            userId: order.userId,
            email: charge.billing_details?.email || "N/A", // Fetch email from charge
            name: charge.billing_details?.name || "N/A",  // Fetch name from charge
            cardNumber: `**** **** **** ${cardLast4}`,  // Store only last 4 digits
            amount: order.totalPrice * 100,
            status: charge.status,
            paymentMethod: charge.payment_method_details?.type || "Unknown",
            transactionId: session_id
        });

        await payment.save();

        // Clear session order ID after successful payment
        req.session.orderId = null;

        res.render("user/payment-success", { order, payment });

    } catch (error) {
        console.error("Payment success error:", error);
        res.status(500).send("Error processing payment confirmation");
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


router.get("/track-order/:orderId", async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate("fuelStationId");

        if (!order) return res.status(404).send("Order not found");

        res.render("user/track", { order });
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

router.get("/fuelstation/:id/nearby-vehicles", async (req, res) => {
    try {
        const fuelStationId = req.params.id;
        console.log(fuelStationId)
        const fs = await FuelStation.findOne({ _id: fuelStationId })

        // Fetch drivers with "on Duty" status for the given fuel station
        const drivers = await Driver.find({ fuelStationId: fs.userId, status: "on Duty" });

        // Fetch their assigned vehicles
        const driversWithVehicles = await Promise.all(
            drivers.map(async (driver) => {
                const vehicle = await Vehicle.findOne({ driverId: driver._id });
                return {
                    driver,
                    vehicle
                };
            })
        );

        res.render("user/nearbyvehicles", { driversWithVehicles });
    } catch (error) {
        console.error("Error fetching nearby vehicles:", error);
        res.status(500).send("Server Error");
    }
});

// Order Page with Vehicle Capacity
router.post("/order/vehicle", async (req, res) => {
    try {
        const { driverId, vehicleId, maxQuantity } = req.body;
        const userId = req.session.userId; // Ensure user is logged in

        if (!userId) return res.redirect("/login");
        if (!mongoose.Types.ObjectId.isValid(driverId) || !mongoose.Types.ObjectId.isValid(vehicleId)) {
            return res.status(400).send("Invalid driver or vehicle ID.");
        }

        const user = await User.findById(userId);
        const driver = await Driver.findById(driverId).populate("userId");
        const vehicle = await Vehicle.findById(vehicleId);
        const fuelStation = await FuelStation.findOne().populate("userId"); // Adjust as needed
        const fuel = await Fuel.findOne(); // Modify based on availability

        if (!driver || !vehicle || !fuelStation || !fuel) {
            return res.status(404).send("Required data not found.");
        }

        res.render("user/nearbyorder", {
            user,
            fuelStation,
            driver,
            vehicle,
            fuel,
            maxQuantity,
        });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Feedback Page Route
router.get("/feedback/:orderId", async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate("fuelStationId");

        if (!order) {
            return res.status(404).send("Order not found.");
        }

        res.render("user/feedback", { order });
    } catch (error) {
        console.error("Error loading feedback page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Submit Feedback
router.post('/feedback/:orderId', async (req, res) => {
    try {
        const { feedback, rating } = req.body;
        const userId = req.session.userId;
        const { orderId } = req.params;

        if (!userId) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        // Get the order to find the fuel station ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send("Order not found.");
        }

        const newFeedback = new Feedback({
            userId,
            fuelStationId: order.fuelStationId,
            feedback,
            rating
        });

        await newFeedback.save();
        res.redirect('/user/my-orders'); // Redirect after submission
    } catch (error) {
        console.error("Error submitting feedback:", error);
        res.status(500).send("Internal Server Error");
    }
});

//payment section for nearby order
router.post('/payment', async (req, res) => {
    try {
        const { userId, fuelStationId, driverId, fuelId, vehicleId, quantity, totalPrice, latitude, longitude, locationAddress, customerName, customerEmail } = req.body;

        // Create a Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'Fuel Order',
                            description: `Fuel Order from ${locationAddress}`,
                        },
                        unit_amount: totalPrice * 100, // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: customerEmail, // ✅ Include customer email
            billing_address_collection: "required", // ✅ Require billing address
            success_url: `http://localhost:5000/user/payment/success?userId=${userId}&fuelStationId=${fuelStationId}&driverId=${driverId}&fuelId=${fuelId}&vehicleId=${vehicleId}&quantity=${quantity}&totalPrice=${totalPrice}&latitude=${latitude}&longitude=${longitude}&locationAddress=${encodeURIComponent(locationAddress)}`,
            cancel_url: 'http://localhost:5000/user/payment/cancel',
        });

        res.redirect(session.url); // Redirect user to Stripe payment page
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).send('Payment failed.');
    }
});


router.get('/payment/success', async (req, res) => {
    try {
        const { userId, fuelStationId, driverId, fuelId, vehicleId, quantity, totalPrice, latitude, longitude, locationAddress } = req.query;

        // Create a new order in the database
        const newOrder = new Order({
            userId,
            fuelStationId,
            assignedDriver: driverId,
            fuelId,
            vehicleId,
            addressType: "location",
            quantity,
            totalPrice,
            latitude,
            date: new Date().toISOString().split('T')[0],
            longitude,
            locationAddress,
            status: 'Assigned',
        });

        await newOrder.save();

        res.redirect('/user/my-orders');
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).send('Order creation failed.');
    }
});


router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.session.userId); // Assuming you're storing userId in session
        res.render('user/profile', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

router.post('/profile/edit', async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        const updateData = { name, phone };

        // If user entered a new password, hash and include it
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        await User.findByIdAndUpdate(req.session.userId, updateData);
        res.redirect('/user/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Update failed");
    }
});

module.exports = router;