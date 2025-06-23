const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'tracket_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Routes
app.get('/', (req, res) => {
    res.render('index');  // index.ejs
});
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);
// app.get('/dashboard', isAuthenticated, (req, res) => {
//     res.render('dashboard', { user: req.session.user });
// });
const projectRoutes = require('./routes/project');
app.use('/', projectRoutes);
const timeRoutes = require('./routes/time');
app.use('/', timeRoutes);
const timesheetRoutes = require('./routes/timesheet');
app.use('/', timesheetRoutes);
const reportRoutes = require('./routes/report');
app.use('/', reportRoutes);
const userRoutes = require('./routes/users');
app.use('/', userRoutes);
const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
