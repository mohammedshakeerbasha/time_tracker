const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register Page
router.get('/register', (req, res) => {
    res.render('register');
});

// Register User
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.send('User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        res.send('Error registering user');
    }
});

// Login Page
router.get('/login', (req, res) => {
    res.render('login');
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.send('No user found');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.send('Incorrect password');

        // Save user in session
        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.redirect('/dashboard');
    } catch (err) {
        res.send('Login error');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});





const { isAuthenticated, isAdmin, isManagerOrAdmin, isEmployee } = require('../middlewares/auth');

module.exports = router;
