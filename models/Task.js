const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isSubTask: { type: Boolean, default: false },
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
