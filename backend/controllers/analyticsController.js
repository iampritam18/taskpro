const Task = require('../models/Task');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId, startDate, endDate } = req.query;

    let query = { userId: new mongoose.Types.ObjectId(userId) };
    if (projectId) query.projectId = new mongoose.Types.ObjectId(projectId);
    if (startDate && endDate) {
      query.deadline = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          overdue: { 
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $lt: ['$deadline', new Date()] },
                    { $ne: ['$status', 'done'] }
                  ] 
                }, 1, 0
              ] 
            } 
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 };
    result.completionRate = result.total > 0 ? Math.round((result.done / result.total) * 100) : 0;

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get tasks over time
// @route   GET /api/analytics/tasks-over-time
exports.getTasksOverTime = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 30 }
    ]);

    res.json(stats.map(s => ({ date: s._id, count: s.count })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get project progress
// @route   GET /api/analytics/project-progress
exports.getProjectProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.find({ userId });
    
    const progress = await Promise.all(projects.map(async (project) => {
      const tasks = await Task.find({ projectId: project._id });
      const total = tasks.length;
      const done = tasks.filter(t => t.status === 'done').length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      
      return {
        name: project.name,
        total,
        done,
        percent,
        color: project.color
      };
    }));

    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
