const express=require("express");
const app=express();
const path=require("path");
const userModel=require("./models/User");
const postModel=require("./models/post");
const cookieParser=require('cookie-parser');
const bcrypt=require("bcrypt");
const jwt =require('jsonwebtoken');
const { register } = require("module");
const upload=require("./config/multerconfig")

app.set("view engine",'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cookieParser());






app.get("/",function(req,res){
    res.render('index');
});
app.get("/profile/upload",function(req,res){
    res.render('profileupload');
});
app.post("/upload",isLoggedIn, upload.single("image"), async function(req,res){
  let user=  await userModel.findOne({email:req.user.email});
  user.profilepic=req.file.filename;
  await user.save();
  
    res.redirect("/profile");
});
app.get("/profile",isLoggedIn, async function(req,res){
   let user= await userModel.findOne({email:req.user.email}).populate("posts");
    
    res.render('profile',{user});
});
app.get("/like/:id",isLoggedIn, async function(req,res){
   let post= await postModel.findOne({_id:req.params.id}).populate("user");
   if(post.likes.indexOf(req.user.userid)===-1){
    post.likes.push(req.user.userid);
   }else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1);
   }
   await post.save()
    
    res.redirect('/profile');
});
app.get("/edit/:id",isLoggedIn, async function(req,res){
   let post= await postModel.findOne({_id:req.params.id}).populate("user");
   res.render("edit",{post})
});
app.post("/update/:id",isLoggedIn, async function(req,res){
   let post= await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
   res.redirect("/profile")
});
app.post("/post",isLoggedIn, async function(req,res){
   let user= await userModel.findOne({email:req.user.email});
   let {content}=req.body;

   let post=await postModel.create({
        user:user._id,
        content
    });
    if(!user.posts){ user.posts = []; }
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile")
});
app.get("/login",function(req,res){
    res.render('login');
});
app.post("/register",async function(req,res){
    let {email,name,username,number,passward}=req.body;
    let user= await userModel.findOne({email});
    if(user)res.status(500).redirect("/login");

    bcrypt.genSalt(10,function(err,salt){
        bcrypt.hash(passward,salt, async function(err,hash){
          let user=await  userModel.create({
                username,
                name,
                email,
                number,
                passward:hash
            });
          const token=  jwt.sign({email:email,userid:user._id},"secretkey");
            res.cookie("token",token);
            res.redirect("/login");
        });
    })
})
app.post("/login",async function(req,res){
    let {email,passward}=req.body;
    let user= await userModel.findOne({email});
    if(!user)res.status(500).send("something went wrong");

   bcrypt.compare(passward,user.passward,function(err,result){
    if(result){ 
     const token=jwt.sign({email:email,userid:user._id},"secretkey");
    res.cookie("token",token);
    res.status(200).redirect("/profile");
    }
    else res.redirect("/login");
   })
})
app.get("/logout",function(req,res){
    res.cookie("token","");
    res.redirect('/login')
});
function isLoggedIn(req,res,next){
    if(!req.cookies||!req.cookies.token) return res.send("you must be logged in ")
        else{
       let data= jwt.verify(req.cookies.token,"secretkey");
        req.user=data;
        next();
    }
    

}

app.listen(5000);