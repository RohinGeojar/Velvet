import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    maxlength: 32,
    trim: true
  },

  lastName: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email"]
  },

  phone: {
    type: String,
    required: true
  },

  password: {
    type: String,
    minlength: 6,
    required: function () {
      return !this.googleId;
    }
  },

  googleId: {
    type: String
  },

  profileImage: {
    type: String
  },
  tempEmail: {
  type: String,
  default: null
},
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  isBlocked: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);