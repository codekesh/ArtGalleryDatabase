const express = require("express");
const Subscribers = require("../models/subscriber");
const router = new express.Router();
const nodemailer = require('nodemailer');
require("dotenv").config();

const transporter = nodemailer.createTransport({
    secure: true,
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendMail(to, sub, msg) {
    transporter.sendMail({
        to: to,
        subject: sub,
        html: msg
    })
}

router.post("/create-subscribers", async (req, res) => {
    try {
        const { name, email } = req.body;

        // checking user
        const existingEmail = await Subscribers.findOne({ email });

        // existing user
        if (existingEmail) {
            return res.status(200).send({
                success: false,
                message: "Already subscribed!",
            });
        }

        // save
        const subscriber = await new Subscribers({ name, email }).save();
        await sendMail(email, "Subsribed", `Hello ${name}, thank you for subscribing to our newsletter!`);
        res.status(201).send({
            success: true,
            message: "Subscribed successfully",
            subscriber,
        });

    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});

router.get("/subscribers", async (req, res) => {
    try {
        const subscriberData = await Subscribers.find();
        res.status(201).send(subscriberData);
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;