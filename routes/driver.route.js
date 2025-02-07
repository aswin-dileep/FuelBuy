const express = require('express')

const router = express.Router();


router.get('/',(req,res)=>{
    res.render('driver/driverhome');
})

module.exports = router;