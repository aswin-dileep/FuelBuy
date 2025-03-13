const express = require('express'); 
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// routes
const indexRouter = require("./routes/index.route");
const adminRouter = require('./routes/admin.route');
const fuelstationRouter = require("./routes/fuelstation.route");
const driverRouter = require('./routes/driver.route');
const userRouter = require('./routes/user.route');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();
const stripe = require("stripe")(process.env.SECRET_STRIPE_KEY);


const app = express() 

const PORT = process.env.PORT || 5000
const MONGO_URL = process.env.MONGO_URL;
app.use(express.static(path.join(__dirname,'public')))

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')


app.use('/',indexRouter);
app.use('/admin',adminRouter);
app.use('/user',userRouter);
app.use('/driver',driverRouter);
app.use('/fuelstation',fuelstationRouter);




mongoose.connect("mongodb://localhost:27017/mainProject")
    .then(()=> { console.log("Database Connection Successfull") })
    .catch((err)=> { console.log("Received an Error in database") })


app.use(session({
    secret: 'superSecretKey', // Change this to a secure key
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: "mongodb://localhost:27017/mainProject",
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));



app.listen(PORT,()=>{
    console.log(`running in port ${PORT}`)
})