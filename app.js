const express = require('express') 
const path = require('path') 
const expressLayout = require('express-ejs-layouts')

// routes
const indexRouter = require("./routes/index.route");

const app = express() 
require('dotenv').config();
const PORT = process.env.PORT || 5000

app.use(express.static(path.join(__dirname,'public')))
app.use(expressLayout)


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.set('layout','layout')

app.use('/',indexRouter);

app.listen(PORT,()=>{
    console.log(`running in port ${PORT}`)
})