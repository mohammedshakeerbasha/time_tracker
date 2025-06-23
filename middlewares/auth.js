// Must be logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/login');
}

// Must be Admin
function isAdmin(req, res, next) {
    if (req.session.user?.role === 'Admin') next();
    else res.send('Access denied: Admin only');
}

// Must be Manager or Admin
function isManagerOrAdmin(req, res, next) {
    const role = req.session.user?.role;
    if (role === 'Manager' || role === 'Admin') next();
    else res.send('Access denied: Manager or Admin only');
}

// Must be Employee
function isEmployee(req, res, next) {
    if (req.session.user?.role === 'Employee') next();
    else res.send('Access denied: Employee only');
}

module.exports = {
    isAuthenticated,
    isAdmin,
    isManagerOrAdmin,
    isEmployee
};
