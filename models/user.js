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
  googleEmail: {
    type: String,
    default: null
  },

  phone: {
    type: String,
    required: false
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
    url: String,
    public_id: String
  },
  tempEmail: {
    type: String,
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
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