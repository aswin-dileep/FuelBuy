const express = require("express")
const User = require('../models/user.model');
const { Collection } = require("mongoose");
const bcrypt = require('bcrypt');
const router = express.Router();

router.get('/',(req,res)=>{
    res.render("index", {title:"FuelBuy"})
})

router.get('/login',(req,res)=>{
    res.render('login')
})
router.post('/login', async(req,res)=>{
    
    try{
        const check = await User.findOne({email:req.body.username});
        
        if(!check){
            res.send("Username not founded")
        }
        
        const ispasswordmath = await bcrypt.compare(req.body.password,check.password); 
        
        
        if(ispasswordmath){
            if(check.role=="admin")
                res.redirect('/admin')
            else if(check.role=="customer")
                res.redirect("/user")
            else if(check.role=="fuel-station")
                res.redirect("/fuelstation")
            else
                res.redirect("/driver");
        }else{
            res.send("Wrong password")
        }
        
    }catch{
            res.send("Something went wrong please try again")
    }
})


router.get('/sign-up',(req,res)=>{
    res.render('signup');
})

router.post('/sign-up',async(req,res)=>{

    const newUser =new User({
        name:req.body.name,
        role:req.body.role,
        email:req.body.email,
        phone:req.body.phone,
        password:req.body.password

    });
    const hashedpassword = await bcrypt.hash(newUser.password,10);
    newUser.password = hashedpassword;
    const userExist = await User.findOne({name:req.body.email});
    if(userExist){
        res.send("<h1>User already Exist</h1>")
    }
    
    newUser.save()

    res.render('index', {title:"FuelBuy"})
    
})

module.exports = router;