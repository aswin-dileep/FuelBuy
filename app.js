const express = require('express'); 
const path = require('path');
const mongoose = require('mongoose');

// routes
const indexRouter = require("./routes/index.route");

const app = express() 
require('dotenv').config();
const PORT = process.env.PORT || 5000
const MONGO_URL = process.env.MONGO_URL;
app.use(express.static(path.join(__dirname,'public')))



app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')


app.use('/',indexRouter);



mongoose.connect(MONGO_URL)
    .then(()=> { console.log("Database Connection Successfull") })
    .catch((err)=> { console.log("Received an Error") })

app.listen(PORT,()=>{
    console.log(`running in port ${PORT}`)
})