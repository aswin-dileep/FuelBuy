const express = require('express')

const router = express.Router();


router.get('/',(req,res)=>{
    res.render('fuelstation/fuelstationhome');
})

module.exports = router;