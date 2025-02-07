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

const app = express() 
require('dotenv').config();
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




mongoose.connect(MONGO_URL)
    .then(()=> { console.log("Database Connection Successfull") })
    .catch((err)=> { console.log("Received an Error") })

app.listen(PORT,()=>{
    console.log(`running in port ${PORT}`)
})