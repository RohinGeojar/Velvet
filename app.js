import express from "express";
import path from "path";
import nocache from "nocache";
import session from "express-session";
import expressLayouts from "express-ejs-layouts";
import dotenv from "dotenv";
import MongoStore from "connect-mongo";
import { connectDB } from "./config/db.js";
import "dotenv/config"
import passport from "./config/passport.js";
import authRoutes from "./routes/user/authRoutes.js"
import profileRoutes from "./routes/user/profileRoutes.js"
import addressRoutes from "./routes/user/addressRoutes.js"
import adminUserRoutes from "./routes/admin/userRoutes.js";
import adminAuth from "./routes/admin/adminAuth.js"
import categoryRoutes from "./routes/admin/categoryRoutes.js"
import productRoutes from "./routes/admin/productRoutes.js"
import shopRoutes from "./routes/user/shopRoutes.js"
import orderRoutes from "./routes/user/orderRoutes.js"
import orderManagementRoutes from "./routes/admin/orderRoutes.js"
import couponRoutes from "./routes/admin/couponRoutes.js"
dotenv.config();

const app = express();
connectDB()
app.use(nocache())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));


app.use(expressLayouts)
app.set("layout", "partials/user/layout");
 
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

app.use((req, res, next) => {

    res.locals.currentPath =
        req.path;

    res.locals.category =
        req.query.category || "";

    next()
})

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next()
})



app.use("/PageNotFound",(req,res)=> {
  return res.status(404).render(
    "pageNotFound",
    {
        showNavbar: false,
        showFooter:false
   }
)
} )
app.use("/",authRoutes );
app.use("/profile", profileRoutes);
app.use("/address",addressRoutes)
app.use("/shop",shopRoutes)
app.use("/orderManagement",orderManagementRoutes)
app.use("/couponManagement",couponRoutes)

app.use("/admin", adminUserRoutes);
app.use("/adminAuth",adminAuth)
app.use("/admin/category",categoryRoutes)
app.use("/products",productRoutes)
app.use("/order",orderRoutes)

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
})