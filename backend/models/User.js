const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    online: { type: Boolean, default: false, index: true },
    status: { type: String, default: "Hey there! I am using ChatApp." },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

UserSchema.methods.toSafeJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    online: this.online,
    status: this.status,
    friends: this.friends,
    blockedUsers: this.blockedUsers
  };
};

module.exports = mongoose.model("User", UserSchema);

