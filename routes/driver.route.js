const express = require('express')

const router = express.Router();


router.get('/',(req,res)=>{
    res.render('driver/driverhome');
})
router.get('/orders',(req,res)=>{
    res.render('driver/orders')
})

module.exports = router;