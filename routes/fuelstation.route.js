const express = require('express')

const router = express.Router();


router.get('/',(req,res)=>{
    res.render('fuelstation/fuelstationhome',{ user: req.session });
})

router.get('/driver_reg',(req,res)=>{
    console.log(req.session)
    res.render('fuelstation/add_driver', {user: req.session})
})

module.exports = router;