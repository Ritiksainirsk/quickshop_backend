const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config()
const app = express();
const port = process.env.PORT || 4000;


app.use(express.json());
app.use(cors());

// mongodb connection with mongodb
mongoose.connect(process.env.MONGO_CONNECTION_URL);

app.listen(port, (error) => {
  if (!error) {
    console.log("Server running on " + port);
  } else {
    console.log(error);
  }
});

// image Storage Engine
const upload = multer({
  storage: multer.diskStorage({
    destination: "./upload/images",
    filename: (req, file, cb) => {
      return cb(
        null,
        `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
      );
    },
  }),
});

app.use("/images",  express.static("upload/images"));
app.post("/uploadimage",upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `https://quickshop-backend.vercel.app/images/${req.file.filename}`,
  });
});

// AddProduct
const Product = require("./Modules/Product.js");

app.post("/addproduct", async (req, res) => {
  const products = await Product.find({});

  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
    console.log(last_product_array);
  } else {
    id = 1;
  }

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  // console.log(product)
  await product.save();
  console.log("saved");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Delete Product
app.post("/deleteproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.send({
    success: true,
    name: req.body.name,
  });
});

// fetch all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All products fetched");
  res.send({ products });
});

// Registration
const User = require("./Modules/User.js");

app.post("/signup", async (req, res) => {
  let exist = await User.findOne({ email: req.body.email });

  if (exist) {
    return res.status(400).json({
      success: false,
      errors: "Existing user found with same email address",
    });
  }

  const cart = {};
  for (let index = 0; index < 300; index++) {
    cart[index] = 0;
  }

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();

  const data = {
    user: {
      id: user.id,
    },
  };

  const token = jwt.sign(data, "secret_ecom");

  res.json({ success: true, token });
});

// login user
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    const compare = req.body.password === user.password;
    if (compare) {
      const data = {
        user: {
          id: user.id,
        },
      };

      const token = jwt.sign(data, "secret_ecom");

      res.json({ success: true, token });
    } else {
      res.status(400).json({ success: false, errors: "Wrong password!" });
    }
  } else {
    res.send({ success: false, errors: "Wrong email id" });
  }
});

// New Collections
app.get("/newcollection", async (req, res) => {
  const products = await Product.find({});

  const newcollection = products.slice(1).slice(-8);
  console.log("New collection fetched");
  res.send({ newcollection });
});

// popular in women
app.get("/popularinwomen", async (req, res) => {
  const products = await Product.find({ category: "women" });

  const popularinwomen = products.slice(0, 4);

  console.log("Popular product fatched");
  res.send({ popularinwomen });
});

// add to cart

// careate a function for fetch use
const fetchUser = (req, res, next) => {
  const token = req.header("auth-token");

  if (!token) {
    res.status(400).send({ error: "please authenticate using valid token" });
  } else {
    try {
      const data = jwt.verify(token, "secret_ecom");
      req.user = data.user;
      next();
    } catch (error) {
      res.status(401).send({ errors: "please authenticate using valid token" });
    }
  }
};

// creating end point for add to cart
app.post("/addtocart", fetchUser, async (req, res) => {
  const userData = await User.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await User.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("added cart Item");
});

// creating end point for deleting cart items
app.post("/removetocart",fetchUser, async (req, res) => {
  const userData = await User.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId]) {
    userData.cartData[req.body.itemId] -= 1;
    await User.findOneAndUpdate(
      { _id: req.user.id },
      { cartData: userData.cartData }
    );
    res.send("removed");
  }
});


// creating end point for getcart data 
app.get('/getcart',fetchUser,async(req,res)=>{
  let userData = await User.findOne({_id:req.user.id})
  res.send(userData.cartData)
})