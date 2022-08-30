const mongoose = require('mongoose')

const mailSchema = mongoose.Schema({
    read:{
        type:Boolean,
        default:false
    },
    sendingto:String,
    mailtext:String,
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
    }
})


module.exports = mongoose.model('mail' , mailSchema)
