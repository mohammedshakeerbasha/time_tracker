const express = require('express');
const router = express.Router();

const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const {
  isAuthenticated,
  isAdmin,
  isManagerOrAdmin,
  isEmployee
} = require('../middlewares/auth');

/**
 * 📊 Dashboard View
 */


router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    let projects = [];

    if (user.role === 'Admin' || user.role === 'Manager') {
      projects = await Project.find(); // Show all
    } else {
      // 🔍 Get tasks assigned to this employee
      const tasks = await Task.find({ assignedTo: user._id }).populate('project');

      // 🔁 Extract unique project IDs
      const uniqueProjectsMap = {};
      tasks.forEach(task => {
        if (task.project && !uniqueProjectsMap[task.project._id]) {
          uniqueProjectsMap[task.project._id] = task.project;
        }
      });

      projects = Object.values(uniqueProjectsMap);
    }

    res.render('dashboard', {
      user: user,
      projects: projects
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});


/**
 * 📁 All Projects (Admin/Manager View)
 */
router.get('/projects', isAuthenticated, isManagerOrAdmin, async (req, res) => {
  try {
    const projects = await Project.find();
    res.render('project_list', { user: req.session.user, projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).send('Server Error');
  }
});

/**
 * ➕ New Project Form
 */
router.get('/projects/new', isAuthenticated, isAdmin, (req, res) => {
  res.render('project_form');
});

/**
 * ✅ Create New Project
 */
router.post('/projects', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    await Project.create({
      name,
      description,
      createdBy: req.session.user._id
    });
    res.redirect('/projects');
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).send('Could not create project');
  }
});

/**
 * 📄 View Single Project and Tasks
 */
router.get('/projects/:id', isAuthenticated, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const tasks = await Task.find({ project: project._id, parentTask: null });
    const users = await User.find();
    res.render('project_detail', { project, tasks, users });
  } catch (err) {
    console.error('Error loading project detail:', err);
    res.status(500).send('Error loading project');
  }
});

/**
 * ➕ Add Task to Project
 */
router.post('/projects/:id/tasks', isAuthenticated, async (req, res) => {
  try {
    const { title, description, assignedTo, parentTask } = req.body;

    await Task.create({
      project: req.params.id,
      title,
      description,
      assignedTo: assignedTo || null,
      parentTask: parentTask || null,
      isSubTask: !!parentTask
    });

    res.redirect(`/projects/${req.params.id}`);
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).send('Could not add task');
  }
});

module.exports = router;
