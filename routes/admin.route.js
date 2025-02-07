const express = require('express')

const router = express.Router();


router.get('/',(req,res)=>{
    res.render('admin/adminhome');
})

router.get('/fuel_reg',(req,res)=>{
    res.render('admin/add_fuelstation')
})

module.exports = router;