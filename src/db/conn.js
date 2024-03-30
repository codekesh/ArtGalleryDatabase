const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://201117:b8TmhOErMNfWetgl@cluster0.m9vxukf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("connection is successful");
  })
  .catch((e) => {
    console.log("No connection");
  });
