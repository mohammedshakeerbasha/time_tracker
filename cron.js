const cron = require('node-cron');
const sendMail = require('./utils/mailer');
const Timesheet = require('./models/Timesheet');
const User = require('./models/User');

// Every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
    const weekStart = new Date();
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // EMPLOYEE REMINDERS
    const employees = await User.find({ role: 'Employee' });
    for (let emp of employees) {
        const existing = await Timesheet.findOne({ user: emp._id, weekStart });
        if (!existing) {
            await sendMail(
                emp.email,
                'Weekly Timesheet Reminder',
                `Hi ${emp.name},\n\nThis is a reminder to submit your weekly timesheet for the week starting ${weekStart.toDateString()}.\n\n- Tracket`
            );
        }
    }

    // MANAGER REMINDERS
    const managers = await User.find({ role: { $in: ['Manager', 'Admin'] } });
    const pendingSheets = await Timesheet.find({ status: 'Pending' }).populate('user');

    if (pendingSheets.length > 0) {
        for (let mgr of managers) {
            await sendMail(
                mgr.email,
                'Pending Timesheets for Approval',
                `Hi ${mgr.name},\n\nYou have ${pendingSheets.length} pending timesheets to review.\n\n- Tracket`
            );
        }
    }

    console.log('✅ Weekly reminder emails sent!');
});
