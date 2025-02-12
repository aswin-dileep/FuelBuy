const express = require('express')

const router = express.Router();


router.get('/',(req,res)=>{
    res.render('fuelstation/fuelstationhome');
})

router.get('/driver_reg',(req,res)=>{
    res.render('fuelstation/add_driver')
})

module.exports = router;