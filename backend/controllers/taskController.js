const Task = require('../models/Task');
const { createActivity } = require('./activityController');

// Get all tasks for a user (with optional project filtering)
exports.getTasks = async (req, res) => {
  const { projectId, tag, startDate, endDate } = req.query;
  const filter = { userId: req.user.id };
  
  if (projectId) filter.projectId = projectId;
  if (tag && tag !== 'All') filter.category = tag;
  
  if (startDate || endDate) {
    filter.deadline = {};
    if (startDate) filter.deadline.$gte = new Date(startDate);
    if (endDate) filter.deadline.$lte = new Date(endDate);
  }

  try {
    const tasks = await Task.find(filter);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a task
exports.createTask = async (req, res) => {
  const { title, description, status, projectId, category, deadline } = req.body;

  try {
    const taskData = {
      title,
      description,
      status,
      userId: req.user.id,
    };

    if (projectId) taskData.projectId = projectId;
    if (category) taskData.category = category;
    if (deadline) taskData.deadline = deadline;

    const task = await Task.create(taskData);
    
    await createActivity({
      user: req.user.id,
      type: 'task_created',
      description: `created task "${task.title}"`,
      task: task._id,
      project: task.projectId
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, projectId, category, deadline } = req.body;

  try {
    let task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const updateData = { title, description, status };
    if (projectId !== undefined) updateData.projectId = projectId;
    if (category !== undefined) updateData.category = category;
    if (deadline !== undefined) updateData.deadline = deadline;

    task = await Task.findByIdAndUpdate(id, updateData, { new: true });
    
    await createActivity({
      user: req.user.id,
      type: 'task_updated',
      description: `updated task "${task.title}" to ${status}`,
      task: task._id,
      project: task.projectId
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const taskTitle = task.title;
    await task.deleteOne();

    await createActivity({
      user: req.user.id,
      type: 'task_deleted',
      description: `deleted task "${taskTitle}"`
    });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
