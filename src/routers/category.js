const express = require("express");
const Category = require("../models/category");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddlewares");
const { default: slugify } = require("slugify");
const router = new express.Router();

router.post("/create-category", requireSignIn, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(200).send({
        success: true,
        message: "Category ALready Exist",
      });
    }

    const category = await new Category({ name, slug: slugify(name) }).save();
    res.status(201).send({
      success: true,
      message: "new category created",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Category",
    });
  }
});

router.get("/category", async (req, res) => {
  try {
    const categoryData = await Category.find();
    res.status(201).send(categoryData);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/category/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const categoryData = await Category.findById(_id);
    if (!categoryData) {
      res.send(404).send({
        success: false,
        message: "Not found",
      });
    } else {
      res.status(201).send(categoryData);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

router.put("/update-category/:id", requireSignIn, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const _id = req.params.id;
    const category = await Category.findByIdAndUpdate(
      _id,
      { name, slug: slugify(name) },
      { new: true }
    );

    res.status(201).send({
      success: true,
      message: "new category created",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while updating Category",
    });
  }
});

router.delete(
  "/delete-category/:id",
  requireSignIn,
  isAdmin,
  async (req, res) => {
    try {
      const _id = req.params.id;
      const deleteCategory = await Category.findByIdAndDelete(_id);
      if (!_id) {
        return res.status(400).send();
      }
      res.send(deleteCategory);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

module.exports = router;
