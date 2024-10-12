const express = require("express");
const cors = require("cors");
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    method: ["GET", "POST", "PUT", "DELETE"],
  })
);

require("dotenv").config();
require("./db/conn");

const userRouter = require("./routers/users");
const categoryRouter = require("./routers/category");
const productRouter = require("./routers/product");
const subscriberRouter = require("./routers/subscriber");

const port = process.env.PORT || 8000;

app.use(express.json());
app.use(userRouter);
app.use(categoryRouter);
app.use(productRouter);
app.use(subscriberRouter);

app.listen(port, () => {
  console.log("connection at", port);
});
