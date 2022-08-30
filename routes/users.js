const mongoose = require('mongoose')
mongoose.connect("mongodb://localhost/gmail")
const plm = require('passport-local-mongoose')
const findOrCreate = require('mongoose-findorcreate')


const userSchema = mongoose.Schema({
  username:String,
  profilePic:{type:String, default:"def.jpg"},
  name:String,
  email:{
    type:String,
    unique:true
  },



  sentMails:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'mail',
      
    }
  ],
  
  receivedMails:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'mail'
    }
  ]

})

userSchema.plugin(plm)
userSchema.plugin(findOrCreate)


module.exports = mongoose.model('user' , userSchema)