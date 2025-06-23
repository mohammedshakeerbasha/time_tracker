const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// List Users
router.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    const users = await User.find();
    res.render('admin_users', { users });
});

// Add User Form
router.get('/admin/users/new', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin_user_form', { user: null });
});

// Create User
router.post('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, role });
    res.redirect('/admin/users');
});

// Edit User Form
router.get('/admin/users/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
    const user = await User.findById(req.params.id);
    res.render('admin_user_form', { user });
});

// Update User
router.post('/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { name, email, role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { name, email, role });
    res.redirect('/admin/users');
});

// Delete User
router.post('/admin/users/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
});

module.exports = router;
