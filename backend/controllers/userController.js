const User = require('../models/User');
const Task = require('../models/Task');

// Get all team members with their task counts
exports.getTeamMembers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    const teamWithStats = await Promise.all(users.map(async (user) => {
      const taskCount = await Task.countDocuments({ userId: user._id });
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'Member',
        tasks: taskCount
      };
    }));

    res.json(teamWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
