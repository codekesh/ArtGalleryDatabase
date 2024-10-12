const mongoose = require("mongoose");
const validator = require("validator");

const subSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
});

const Subscribers = new mongoose.model("Subscribers", subSchema);

module.exports = Subscribers;
