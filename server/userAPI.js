const express = require('express');
const router = express.Router();
const USER = require('./models/user.js');

//test-login API for logging and storing data into MONGODB
router.post('/login', async (req, res) => {
    try {
        const { username, balance } = req.body;
        const findUser = await USER.findOne({ username });

        if (findUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const user = await USER.create({ username, balance });
        res.status(200).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//get all registered user's data
router.get('/getallusers', async (req, res) => {
    try {
        const users = await USER.find({});
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
