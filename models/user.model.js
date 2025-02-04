const { name } = require('ejs')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        
    },
    role:{
        type:String,
        required:true
    },
    dob:{
        type:String,
        required:true
    }
})

const userModel = new mongoose.model('user',userSchema);

module.exports = userModel;