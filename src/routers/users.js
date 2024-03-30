const express = require("express");
const Users = require("../models/users");
const { hashPassword, comparePassword } = require("../helper/authHelper");
const router = new express.Router();

const JWT = require("jsonwebtoken");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddlewares");

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

    // checking user
    const existingEmail = await Users.findOne({ email });
    const existingUser = await Users.findOne({ username });

    // existing user
    if (existingEmail) {
      return res.status(200).send({
        success: false,
        message: "Already Register please login",
      });
    }
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Already taken try different one",
      });
    }
    // hash password
    const hashedPassword = await hashPassword(password);

    // save
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

router.patch("/users/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const updatauser = await Users.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    res.send(updatauser);
  } catch (e) {
    res.status(400).send(e);
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

    // check user
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registerd",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "login succesfully",
      user: {
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
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

module.exports = router;
