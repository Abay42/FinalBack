const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path"); 
const bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();
const jwt = require("jsonwebtoken");
const fs = require('fs');
const secretKey = "your-secret-key";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect("mongodb+srv://veyesss:1@cluster0.ewtj4vw.mongodb.net/", { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  userID: mongoose.Schema.Types.ObjectId,
  username: String,
  password: String,
  creationDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  deletionDate: { type: Date, default: null },
  isAdmin: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

const itemSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  images: [
    {
      url: String,
      descriptions: {
        english: String,
        russian: String
      }
    }
  ],
  name: {
    english: String,
    russian: String
  },
  descriptions: {
    english: String,
    russian: String
  },
  timestamps: {
    creation: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now },
    deletion: { type: Date, default: null }
  }
});

const Item = mongoose.model("Item", itemSchema);


const authenticateUser = (req, res, next) => {
  if (req.path.startsWith('/news') || req.path.startsWith('/nba')) {
    return next();
  }
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.redirect("/login");
    }
    req.user = user;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.username) {
      const username = req.user.username;

      const user = await User.findOne({ username });

      if (user && user.isAdmin) {
        return next(); 
      }
    }

    res.redirect("/login");
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.redirect("/login");
  }
};


app.get("/admin", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin", { user: req.user, users });
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    res.redirect("/login");
  }
});

app.get("/admin/users", isAdmin,async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false });
    res.render("adminUsers", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.render("adminUsers", { error: "Error fetching users. Please try again." });
  }
});


app.get("/admin/users/:userId/delete", authenticateToken, async (req, res) => {
  try {
    console.log("Authenticated User:", req.user);

    const userId = req.params.userId;
    const userToDelete = await User.findById(userId);
    console.log("User to Delete:", userToDelete);

    if (!userToDelete) {
      return res.status(404).send("User not found.");
    }

    await User.findByIdAndDelete(userId);

    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.redirect("/admin/users");
  }
});

app.get("/admin/users/:userId/edit", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const foundUser = await User.findById(userId);
    res.render("editUser", { user: foundUser });
  } catch (error) {
    console.error("Error fetching user for edit:", error);
    res.redirect("/admin/users");
  }
});

app.post("/admin/users/:userId/edit", authenticateToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { username, password } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      console.error("User not found.");
      return res.redirect("/admin/users");
    }

    user.username = username;
  
    if (password) {
      user.password = password;
    }

    await user.save();

    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error updating user:", error);
    res.redirect("/admin/users");
  }
});



app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.render("signup", { error: "Username already exists. Please choose another." });
    } else {
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = new User({ username, password: hashedPassword });

      await newUser.save();

      const token = jwt.sign({ username: newUser.username }, secretKey);
      res.cookie("token", token, { httpOnly: true });
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error during sign up:", error);
    res.render("signup", { error: "Error during sign up. Please try again." });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = jwt.sign({ username: user.username }, secretKey);
        res.cookie("token", token, { httpOnly: true });
        res.redirect("/");
      } else {
        res.render("login", { error: "Invalid username or password" });
      }
    } else {
      res.render("login", { error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.render("login", { error: "Error during login. Please try again." });
  }
});

app.get("/nbaTeamInfo", authenticateUser, async (req, res) => {
  const { ID } = req.query;
  console.log("Query Parameters:", req.query);
  const url = `https://api.balldontlie.io/v1/teams/${ID}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        Authorization: "1bf792a6-ff93-44ec-8ade-17aebe374d1b",
      },
    });

    const nbaData = response.data;
    console.log("NBA API Response:", nbaData);

    if (nbaData && nbaData.data) {
      console.log("Rendering with NBA data:", nbaData.data);
      res.render('nbaTeamInfo', { nbaData: nbaData.data });
    } else {
      console.log("Rendering with no NBA data");
      res.render('nbaTeamInfo', { nbaData: null });
    }
  } catch (error) {
    console.error('Error fetching NBA team data:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/nba", authenticateUser, async (req, res) => {
  const url = "http://api.balldontlie.io/v1/players";
  const { first_name, last_name} = req.query;
  console.log("Query Parameters:", req.query);
  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        Authorization: "1bf792a6-ff93-44ec-8ade-17aebe374d1b",
      },
      params: {
        first_name,
        last_name,
      },
    });

    const nbaData = response.data;
    console.log("NBA API Response:", nbaData);

    if (nbaData && nbaData.data && nbaData.data.length > 0) {
      console.log("Rendering with NBA data:", nbaData.data);
      res.render('nba', { nbaData: nbaData.data });
    } else {
      console.log("Rendering with no NBA data");
      res.render('nba', { nbaData: null });
    }

  } catch (error) {
    console.error('Error fetching NBA data:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/", (req, res) => {
  res.render("index", {error: null });
});

app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/api/items", authenticateToken, isAdmin, async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/items/:itemId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const updatedItem = await Item.findByIdAndUpdate(itemId, req.body, {
      new: true
    });
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/items/:itemId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const itemId = req.params.itemId;
    await Item.findByIdAndDelete(itemId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/carousel", (req, res) => {
  try {
    const carouselData = JSON.parse(
      fs.readFileSync("carouselData.json", "utf-8")
    );

    carouselData.items.forEach((item) => {
      item.images = item.images.map((image) => `/api/images/${image}`);
    });

    res.json(carouselData);
  } catch (error) {
    console.error("Error reading carousel data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/images/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "images", imageName);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: "Image not found" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
