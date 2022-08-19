const mongoose = require("mongoose");

const UserSchemea = mongoose.Schema({
  FirstName: String,
  LastName: String,
  Password: String,
  Email: {
    type: String,
    unique: true,
  },
  verified:{type:Boolean}
});

exports.userDb = mongoose.model("User", UserSchemea);
