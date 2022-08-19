const mongoose = require("mongoose");

const verifyAccountSchema = new mongoose.Schema(
  {
    userId: { type: String},
    uniqueString:{type:String},
    createAt:{type:Date},
    expiredAt:{type:Date}
  }
);

module.exports = mongoose.model("VerifyUser", verifyAccountSchema);
