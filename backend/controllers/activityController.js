const Activity = require('../models/Activity');

// Get recent activities for a user
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal function to create activity
exports.createActivity = async ({ user, type, description, task, project }) => {
  try {
    await Activity.create({ user, type, description, task, project });
  } catch (error) {
    console.error('Failed to create activity log:', error.message);
  }
};
