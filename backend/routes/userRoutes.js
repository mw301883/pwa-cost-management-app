const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email już istnieje" });
        }

        const user = new User({ email, password });
        await user.save();

        res.status(201).json({ message: "Użytkownik zarejestrowany" });
    } catch (error) {
        res.status(500).json({ message: "Błąd serwera" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Nie znaleziono użytkownika" });
        }

        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Nieprawidłowe hasło" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, userId: user._id, message: "Zalogowano pomyślnie" });
    } catch (error) {
        res.status(500).json({ message: "Błąd serwera" });
    }
});

module.exports = router;
