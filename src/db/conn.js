const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://201117:2Cudq5XZTTMOSsev@cluster0.hg9dw0m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("connection is successful");
  })
  .catch((e) => {
    console.log("No connection");
  });
