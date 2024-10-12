const express = require("express");
const Users = require("../models/users");
const { hashPassword, comparePassword } = require("../helper/authHelper");
const router = new express.Router();
const JWT = require("jsonwebtoken");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddlewares");
const Order = require("../models/order");
require("dotenv").config();

router.post("/users", async (req, res) => {
  try {
    const {
      name,
      dob,
      gender,
      contact,
      email,
      address,
      username,
      password,
      answer,
    } = req.body;

    // Checking user
    const existingEmail = await Users.findOne({ email });
    const existingUser = await Users.findOne({ username });

    // Existing user
    if (existingEmail) {
      return res.status(200).send({
        success: false,
        message: "Already Registered, please login",
      });
    }
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Username already taken, try a different one",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Save user
    const user = await new Users({
      name,
      dob,
      gender,
      contact,
      email,
      address,
      username,
      password: hashedPassword,
      answer,
    }).save();

    res.status(201).send({
      success: true,
      message: "Registered successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get("/users", async (req, res) => {
  try {
    const usersData = await Users.find();
    res.status(201).send(usersData);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const userData = await Users.findById(_id);
    if (!userData) {
      res.send(404).send();
    } else {
      res.status(201).send(userData);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const deleteuser = await Users.findByIdAndDelete(_id);
    if (!_id) {
      return res.status(400).send();
    }
    res.send(deleteuser);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check user
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered",
      });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = JWT.sign({ _id: user._id }, "secret", {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "Login successfully",
      user: {
        dob: user.dob,
        name: user.name,
        role: user.role,
        email: user.email,
        gender: user.gender,
        answer: user.answer,
        contact: user.contact,
        address: user.address,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
});

// protected user route
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

// protected admin route
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

// forgot password
router.post("/forgotPassword", async (req, res) => {
  try {
    const { email, newpassword, answer } = req.body;

    // Check for the user by email
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Check if the answer is correct
    if (user.answer !== answer) {
      return res.status(401).send({
        success: false,
        message: "Incorrect answer",
      });
    }

    // If the answer is correct, update the password
    const hashed = await hashPassword(newpassword);
    await Users.findByIdAndUpdate(user._id, { password: hashed });

    res.status(200).send({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
});

router.put("/profile", requireSignIn, async (req, res) => {
  try {
    const {
      dob,
      name,
      email,
      gender,
      answer,
      contact,
      address,
      username,
      password,
    } = req.body;
    const user = await Users.findById(req.user._id);

    if (password && password.length < 6) {
      return res.json({ error: "Password is required and must be at least 6 characters long." });
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await Users.findByIdAndUpdate(
      req.user._id,
      {
        dob: dob || user.dob,
        name: name || user.name,
        email: email || user.email,
        gender: gender || user.gender,
        answer: answer || user.answer,
        contact: contact || user.contact,
        address: address || user.address,
        username: username || user.username,
        password: hashedPassword || user.password,
      },
      { new: true }
    );

    res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating profile",
      error,
    });
  }
});

router.get("/orders", requireSignIn, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
});

router.get("/all-orders", requireSignIn, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
});

router.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const orders = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error While Updating Order",
        error,
      });
    }
  }
);

module.exports = router;
