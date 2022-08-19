const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { userDb } = require("../model/userdb");
const nodemailer = require('nodemailer');
const OTP = require("../model/OTP");
const path = require('path');
const UserVerification = require('../model/VerifyAccount');
const {v4:uuidv4} = require('uuid');

// api
// var API_KEY = "72aef744734ec6101950ba7944f9f13f-100b5c8d-2273b885";
// var DOMAIN = "sandbox8e72cf00df7c440e80184d74c9553685.mailgun.org";
// var mailgun = require("mailgun-js")({ apiKey: API_KEY, domain: DOMAIN });

// Transport OF NodeMailer
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {// who send email
    user: 'jjjbaque@gmail.com',
    pass: "ssdegevdbvdmtgcx"
  }
});

// Verification function.
const sendVerificationEmail = async ({_id,Email},res)=>{
  const currentUrl = "http://localhost:5000/";
  const uniqueString = uuidv4() + _id;

  const mailOption = {
    from:"jjjbaque@gmail.com",
    to:Email,
    subject:"Verify your Email",
    html:`<p> Verify Email to active account</p><p> Link expire in 1 hour</p>
    <p> Press <a href=${currentUrl + "users/verify/" + _id + "/"+uniqueString}>here</a> to activate account</p>`
  };
  const addVerification = new UserVerification({
    userId:_id,
    uniqueString:uniqueString,
    createAt:Date.now(),
    expireAt:Date.now()+3600000
  });
  const add = await addVerification.save();
  if(add){
    const sended = await transporter.sendMail(mailOption);
    if(sended){
      return "Verification mail sended and Register SuccessFully";
    }else{return "Mail not sended";}
  }
  else{
    return "No verfication is added";
  }
}

//Link hit in mail to get HTML page
router.get('/verify/:userId/:uniqueString',async (req,res)=>{
  const {userId,uniqueString} = req.params;
  const findVerify  = await UserVerification.findOne({userId:userId});
  if(findVerify){
    if(findVerify.expireAt< Date.now()){
      const deleteExpire = await UserVerification.deleteOne({userId:userId});
      if(deleteExpire){
        const deleteUser = await userDb.deleteOne({_id:userId});
        if(deleteUser){
          res.redirect(`/users/verified/error=true&message=${"Link Expire"}`)
        }
        else{
          res.redirect(`/users/verified/error=true&message=${"Error while deleting user Record"}`)
        }
        
      }
      else{
        res.redirect(`/users/verified/error=true&message=${"Error Occure while clearing Expire Link"}`)
      }
      
    }
    else{
      const updateVerify = await userDb.findByIdAndUpdate({_id:userId},{$set:{verified:true}});
      if(updateVerify){
        const deleteVerify = await UserVerification.deleteOne({userId:userId});
        if(deleteVerify){
          res.sendFile(path.join(__dirname,"./../views/verified.html"));
        }
      }
      else{
        res.redirect(`/users/verified/error=true&message=${"Account not Activated"}`)
      }
      
    }
  }
  else{
    res.redirect(`/users/verified/error=true&message=${"Account Record not found or Already Verified"}`)
  }

});
router.get("/verified",(req,res)=>{
  res.sendFile(path.join(__dirname,"./../views/verified.html"))
});



// USER Signup ADDED
router.post("/signup",async (req, res) => {
  const data = req.body;
  const NewUser = new userDb({
    FirstName: data.FirstName,
    LastName: data.LastName,
    Password: data.Password,
    Email: data.Email,
    verified:false
  });
  NewUser.save()
    .then((user) => {
      sendVerificationEmail(user,res).then((msg)=>{
        res.status(200).json({
          user,
          msg: msg,
          status: "200",
        });
      }).catch((err)=>{res.status(500).json({
        error: err.message,
        status: 500,
      });})  
    })
    .catch((err) => {
      res.status(500).json({
        error: err.message,
        status: 500,
      });
    });
});

// USER Sign-in
router.post("/signin", (req, res) => {
  userDb
    .findOne({ Email: req.body.Email, Password: req.body.Password })
    .then((user) => {
      if (user) {
        if(user.verified){
          console.log(user.verified);
          res.status(200).json({
            sucess: true,
            msg: "User Login",
            user: user,
          });
        }
        else{
          console.log(user)
          res.status(422).json({ status:"422", msg: "User Not Verified" });
        }
        
      } else {
         res.send(user.verified);
      }
    })
    .catch((err) => {
       res.status(404).json({ status: "404", msg: err.message });
    });
});

// Sending OTP to Email
router.post('/sendOTP',async (req,res)=>{
  console.log(req.body);
  const Email = req.body.Email;
  const find = await userDb.findOne({Email:Email});
  console.log(find);
  if(find){
    const otp = Math.floor(1000+Math.random()*9999);
console.log(Email)
    var mailOptions ={
      from: 'jjjbaque@gmail.com',
      to: Email,// who recieve email
      subject: 'Forget Password OTP',
      html: `<h1>OTP</h1><br></br>Email: ${otp}` 
    };
    transporter.sendMail(mailOptions);
    const addOTP = new OTP({
      Email:Email,
      otp:otp
    })
    addOTP.save();
    return res.status(200).send({"msg":"OTP Send SuccessFully"})
  }
  else{
    return res.send({"msg":"Invalid Email"});
  }

});


// Verify Email
router.post('/verifyOTP',async (req,res)=>{
  const {Email,otp} = req.body;
  const verify = await OTP.findOne({Email:Email,otp:otp});
  if(verify){
    await OTP.findOneAndRemove({Email:Email});
    return res.send({"msg":"Verified"});
  }
  else{
    return res.send({"msg":"Invalid OTP"});
  }
});

// Update Password
router.post('/updatePassword',async (req,res)=>{
  const {Email,Password}  = req.body;
  const update  = await userDb.findOneAndUpdate({Email:Email},{$set:{Password:Password}})
  if(update){
    return res.status(200).send({"msg":"Paaword Updated"});
  }
  else{
    return res.send({"msg":"Invalid"});
  }
});


module.exports = router;
