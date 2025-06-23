const express = require('express');
const router = express.Router();
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { Parser } = require('json2csv');

const ExcelJS = require('exceljs');const PDFDocument = require('pdfkit');


const { isAuthenticated, isAdmin, isEmployee } = require('../middlewares/auth');



function isManagerOrAdmin(req, res, next) {
    if (['Manager', 'Admin'].includes(req.session.user.role)) next();
    else res.send('Access Denied');
}

// Report filter form
router.get('/reports', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    const users = await User.find();
    res.render('report_filter', { users });
});

// View filtered report
router.post('/reports/view', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    const { user, fromDate, toDate } = req.body;

    const logs = await TimeLog.find({
        user,
        createdAt: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
        }
    }).populate('task');

    const total = logs.reduce((sum, log) => sum + log.duration, 0);
    const billable = logs.filter(l => l.billable).reduce((sum, l) => sum + l.duration, 0);
    const nonBillable = total - billable;

    res.render('report_result', {
        logs, total, billable, nonBillable, userId: user, fromDate, toDate
    });
});

// Export as CSV
router.get('/reports/export', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    const { user, from, to } = req.query;

    const logs = await TimeLog.find({
        user,
        createdAt: {
            $gte: new Date(from),
            $lte: new Date(to)
        }
    }).populate('task');

    const data = logs.map(log => ({
        Task: log.task.title,
        Description: log.description,
        Duration: log.duration,
        Billable: log.billable ? 'Yes' : 'No',
        Date: log.createdAt.toDateString()
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('timelog_report.csv');
    return res.send(csv);
});


router.get('/reports/export/excel', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    const { user, from, to } = req.query;

    const logs = await TimeLog.find({
        user,
        createdAt: {
            $gte: new Date(from),
            $lte: new Date(to)
        }
    }).populate('task user');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Time Logs');

    sheet.columns = [
        { header: 'User', key: 'user', width: 25 },
        { header: 'Task', key: 'task', width: 30 },
        { header: 'Description', key: 'desc', width: 40 },
        { header: 'Duration (min)', key: 'duration', width: 15 },
        { header: 'Billable', key: 'billable', width: 10 },
        { header: 'Date', key: 'date', width: 20 }
    ];

    logs.forEach(log => {
        sheet.addRow({
            user: log.user.name,
            task: log.task.title,
            desc: log.description || '',
            duration: log.duration,
            billable: log.billable ? 'Yes' : 'No',
            date: log.createdAt.toDateString()
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="timelog_report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
});

 

router.get('/reports/export/pdf', isAuthenticated, isManagerOrAdmin, async (req, res) => {
    const { user, from, to } = req.query;

    const logs = await TimeLog.find({
        user,
        createdAt: {
            $gte: new Date(from),
            $lte: new Date(to)
        }
    }).populate('task user');

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="timelog_report.pdf"');

    doc.pipe(res);

    doc.fontSize(18).text('Time Log Report', { underline: true });
    doc.moveDown();

    doc.fontSize(12);
    logs.forEach((log, index) => {
        doc.text(`#${index + 1}`);
        doc.text(`User: ${log.user.name}`);
        doc.text(`Task: ${log.task.title}`);
        doc.text(`Description: ${log.description || '-'}`);
        doc.text(`Duration: ${log.duration} min`);
        doc.text(`Billable: ${log.billable ? 'Yes' : 'No'}`);
        doc.text(`Date: ${log.createdAt.toDateString()}`);
        doc.moveDown();
    });

    doc.end();
});



module.exports = router;
