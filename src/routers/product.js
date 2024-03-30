const express = require("express");
const Product = require("../models/product");
const { requireSignIn, isAdmin } = require("../middlewares/authMiddlewares");
const { default: slugify } = require("slugify");
const router = new express.Router();
const formidable = require("express-formidable");
const fs = require("fs");
const Category = require("../models/category");

router.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidable(),
  async (req, res) => {
    try {
      const {
        name,
        slug,
        description,
        price,
        category,
        quantity,
        artists,
        shipping,
      } = req.fields;
      const { photo } = req.files;
      switch (true) {
        case !name:
          return res.status(500).send({ error: "Name is required" });
        case !description:
          return res.status(500).send({ error: "Description is required" });
        case !price:
          return res.status(500).send({ error: "Price is required" });
        case !category:
          return res.status(500).send({ error: "Category is required" });
        case !quantity:
          return res.status(500).send({ error: "Quantity is required" });
        case !artists:
          return res.status(500).send({ error: "Artists is required" });
        case photo && photo.size > 1000000:
          return res
            .status(500)
            .send({ error: "Photo is required and less than 1 mb" });
      }

      const products = new Product({ ...req.fields, slug: slugify(name) });
      if (photo) {
        products.photo.data = fs.readFileSync(photo.path);
        products.photo.contentType = photo.type;
      }
      await products.save();
      res.status(201).send({
        success: true,
        message: "New Product created",
        products,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        error,
        message: "Error in Product",
      });
    }
  }
);

router.get("/product", async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "All Products gets fetched",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
});

router.get("/product/:slug", async (req, res) => {
  try {
    const productData = await Product.findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      productData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
});

router.put(
  "/update-product/:id",
  requireSignIn,
  isAdmin,
  formidable(),
  async (req, res) => {
    try {
      const {
        name,
        slug,
        description,
        price,
        category,
        quantity,
        artists,
        shipping,
      } = req.fields;
      const { photo } = req.files;

      switch (true) {
        case !name:
          return res.status(500).send({ error: "Name is required" });
        case !description:
          return res.status(500).send({ error: "Description is required" });
        case !price:
          return res.status(500).send({ error: "Price is required" });
        case !category:
          return res.status(500).send({ error: "Category is required" });
        case !quantity:
          return res.status(500).send({ error: "Quantity is required" });
        case !artists:
          return res.status(500).send({ error: "Artists is required" });
        case photo && photo.size > 1000000:
          return res
            .status(500)
            .send({ error: "Photo is required and less than 1 mb" });
      }

      const products = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.fields, slug: slugify(name) },
        { new: true }
      );
      if (photo) {
        products.photo.data = fs.readFileSync(photo.path);
        products.photo.contentType = photo.type;
      }
      await products.save();
      res.status(201).send({
        success: true,
        message: "Product Updated Successfully",
        products,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        error,
        message: "Error in Update product",
      });
    }
  }
);

router.get("/product-photo/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
});

router.delete(
  "/delete-product/:id",
  requireSignIn,
  isAdmin,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id).select(
        "-photo"
      );
      res.status(200).send({
        success: true,
        message: "Product Deleted successfully",
        product,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error while deleting product",
        error,
      });
    }
  }
);

router.post("/product-filters", async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await Product.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
  }
});

router.get("/product-count", async (req, res) => {
  try {
    const total = await Product.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
});

router.get("/product-list/:page", async (req, res) => {
  try {
    const perPage = 4;
    const page = req.params.page ? req.params.page : 1;
    const products = await Product.find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error in per page ctrl",
      error,
    });
  }
});

router.get("/search/:keyword", async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    }).select("-photo");
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
});

router.get("/related-product/:pid/:cid", async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await Product.find({
      category: cid,
      _id: { $ne: pid },
    })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while getting related product",
      error,
    });
  }
});

router.get("/product-category/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    const products = await Product.find({ category })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      error,
      message: "Error while getting products",
    });
  }
});

module.exports = router;
