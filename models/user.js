const mongoose=require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/miniproject");
const userschema=mongoose.Schema({
    username:String,
    name:String,
    age:Number,
    email:String,
    passward:String,
    profilepic:{
      type:String,
      default:"default.webp"
    },
   posts: { type: [mongoose.Schema.Types.ObjectId],
     ref: "post", 
     default: []
     }
});
module.exports=mongoose.model("User",userschema);