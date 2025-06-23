const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const { isAuthenticated, isAdmin, isManagerOrAdmin, isEmployee } = require('../middlewares/auth');


// View time logs for user
router.get('/timelogs', isAuthenticated, async (req, res) => {
  let logs;

  if (req.session.user.role === 'Admin' || req.session.user.role === 'Manager') {
    // Show all logs if admin or manager
    logs = await TimeLog.find().populate('task');
  } else {
    // Show only employee’s logs
    logs = await TimeLog.find({ user: req.session.user._id }).populate('task');
  }

  res.render('timelogs', { logs,user: req.session.user });
});


router.get('/tasks/:id/logtime', isAuthenticated, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    let logs = [];

    // If admin or manager, show all logs for this task
    if (req.session.user.role === 'Admin' || req.session.user.role === 'Manager') {
      logs = await TimeLog.find({ task: req.params.id }).populate('user');
    } else {
      // Only own logs
      logs = await TimeLog.find({ task: req.params.id, user: req.session.user._id });
    }
 
    
    res.render('logtime_form', { task, logs, user: req.session.user });
  } catch (err) {
    console.error('Logtime view error:', err);
    res.status(500).send('Error loading log time page');
  }
});



// Save manual time log
router.post('/tasks/:id/logtime', isAuthenticated, async (req, res) => {
    const { description, duration } = req.body;
    await TimeLog.create({
        task: req.params.id,
        user: req.session.user._id,
        description,
        duration
    });
    res.redirect('/timelogs');
});


// Start timer
router.post('/tasks/:id/start-timer', isAuthenticated, async (req, res) => {
    const existingTimer = await TimeLog.findOne({
        user: req.session.user._id,
        task: req.params.id,
        endTime: null
    });

    if (existingTimer) return res.send('Timer already running for this task.');

    await TimeLog.create({
        task: req.params.id,
        user: req.session.user._id,
        startTime: new Date()
    });

    res.redirect('/timelogs');
});

// Stop timer
router.post('/tasks/:id/stop-timer', isAuthenticated, async (req, res) => {
    const timer = await TimeLog.findOne({
        user: req.session.user._id,
        task: req.params.id,
        endTime: null
    });

    if (!timer) return res.send('No active timer found.');

    const endTime = new Date();
    const duration = Math.round((endTime - timer.startTime) / 60000); // in minutes

    timer.endTime = endTime;
    timer.duration = duration;
    await timer.save();

    res.redirect('/timelogs');
});


router.get('/logtime', isAuthenticated, async (req, res) => {
  try {
    const logs = await TimeLog.find({ user: req.session.user._id }).populate('task');
    res.render('logtime_form', { logs }); // ✅ Pass logs to the view
  } catch (err) {
    console.error('Error fetching time logs:', err);
    res.status(500).send('Error loading time log form');
  }
});


module.exports = router;
