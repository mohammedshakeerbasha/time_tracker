const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: String,
    duration: Number, // duration in minutes
    startTime: Date,
    endTime: Date,
    billable: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now }
    

});

module.exports = mongoose.model('TimeLog', timeLogSchema);
