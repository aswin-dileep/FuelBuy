const express = require("express")
const User = require('../models/user.model')
const router = express.Router();

router.get('/',(req,res)=>{
    res.render("index", {title:"FuelBuy"})
})

router.get('/login',(req,res)=>{
    res.render('login')
})

router.get('/sign-up',(req,res)=>{
    res.render('signup');
})

router.post('/sign-up',(req,res)=>{
    // const newUser =new User({
    //     name:"Aswin",
    //     role:"Admin",
    //     email:"aswindileep22@gmail.com",
    //     phone:"1234567890",
    //     dob:"26-06-2002"

    // });
    // newUser.save()

    res.render('index', {title:"FuelBuy"})
    
})

module.exports = router;