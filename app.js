import express from "express";
import path from "path";
import session from "express-session";
import expressLayouts from "express-ejs-layouts";
import dotenv from "dotenv";
import authRoutes from "./routes/user/authRoutes.js"
import profileRoutes from "./routes/user/profileRoutes.js"
import { connectDB } from "./config/db.js";
import MongoStore from "connect-mongo";
import flash from "connect-flash";
import addressRoutes from "./routes/user/addressRoutes.js"

dotenv.config();

const app = express();
connectDB()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.use(expressLayouts);
app.set("layout", "partials/layout");

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


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});