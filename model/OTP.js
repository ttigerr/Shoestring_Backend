const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
  {
    Email: { type: String, required: true },
    otp:{
        type:Number,
        required:true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", OTPSchema);