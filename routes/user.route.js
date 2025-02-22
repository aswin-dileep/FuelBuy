const express = require('express')
const FuelStation = require('../models/fuelstation.model');
const router = express.Router();


router.get('/',(req,res)=>{
    res.render('user/userhome');
})


router.get('/fuelstations', async (req, res) => {
    try {
        const FS = await  FuelStation.find(); // Use await
        res.render('user/fuelstations', { stations: FS }); // Pass correct variable
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

//orders

router.get('/order/:id',async (req,res)=>{
    const id = req.params.id
    const FS = await FuelStation.find({_id:id})
    res.render('user/order',{station:FS})
})

module.exports = router;