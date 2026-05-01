import express from "express";
import path from "path";
import nocache from "nocache";
import session from "express-session";
import expressLayouts from "express-ejs-layouts";
import dotenv from "dotenv";
import "dotenv/config";
import authRoutes from "./routes/user/authRoutes.js"
import profileRoutes from "./routes/user/profileRoutes.js"
import { connectDB } from "./config/db.js";
import MongoStore from "connect-mongo";
import flash from "connect-flash";
import addressRoutes from "./routes/user/addressRoutes.js"
import adminUserRoutes from "./routes/admin/userRoutes.js";
import adminAuth from "./routes/admin/adminAuth.js"
import { setAdmin } from "./middleware/admin/authMiddilware.js";
import passport from "./config/passport.js";

dotenv.config();

const app = express();
connectDB()
app.use(nocache())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));


app.use(expressLayouts)
 app.use((req, res, next) => {
  if (
    req.originalUrl.startsWith("/admin") ||
    req.originalUrl.startsWith("/adminAuth")
  ) {
    res.locals.layout = "partials/admin/adminLayout";
  } else {
    res.locals.layout = "partials/user/layout";
  }
  next();
});
app.use(express.static("public"));


app.use(session({
  secret: process.env.SECRET, 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
  mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
})
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});



app.use("/",authRoutes );
app.use("/profile", profileRoutes);
app.use("/address",addressRoutes)
app.use("/admin", adminUserRoutes);
app.use("/adminAuth",adminAuth)


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});