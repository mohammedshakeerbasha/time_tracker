const express = require('express');
const router = express.Router();
const Timesheet = require('../models/Timesheet');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');

const { isAuthenticated, isAdmin, isEmployee } = require('../middlewares/auth');


function isManagerOrAdmin(req, res, next) {
    if (['Manager', 'Admin'].includes(req.session.user.role)) next();
    else res.send('Access Denied');
}

// Get current week start (Monday)
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// Show weekly timesheet for logged-in user
router.get('/timesheet', isAuthenticated, isEmployee, async (req, res) => {
    const weekStart = getWeekStart(new Date());
    const logs = await TimeLog.find({
        user: req.session.user._id,
        createdAt: { $gte: weekStart }
    }).populate('task');

    const existingSheet = await Timesheet.findOne({
        user: req.session.user._id,
        weekStart
    });

    res.render('timesheet_view', { logs, weekStart, status: existingSheet?.status || 'Not Submitted' });
});

// Submit timesheet
router.post('/timesheet/submit', isAuthenticated, async (req, res) => {
    const weekStart = getWeekStart(new Date());

    const exists = await Timesheet.findOne({ user: req.session.user._id, weekStart });
    if (exists) return res.send('Timesheet already submitted.');

    await Timesheet.create({ user: req.session.user._id, weekStart });
    res.redirect('/timesheet');
});

// Admin/Manager: List all submitted timesheets
router.get('/timesheets/pending', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    const pendingSheets = await Timesheet.find({ status: 'Pending' }).populate('user');
    res.render('timesheet_approvals', { timesheets: pendingSheets });
});

// Admin/Manager: Approve or Reject
router.post('/timesheets/:id/:action', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    const { id, action } = req.params;
    const update = {
        status: action === 'approve' ? 'Approved' : 'Rejected',
        reviewedBy: req.session.user._id,
        reviewedAt: new Date()
    };
    await Timesheet.findByIdAndUpdate(id, update);
    res.redirect('/timesheets/pending');
});


module.exports = router;
