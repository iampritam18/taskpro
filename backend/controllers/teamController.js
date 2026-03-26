const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get all team members
// @route   GET /api/team
exports.getTeam = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    const teamData = await Promise.all(users.map(async (user) => {
      const assignedCount = await Task.countDocuments({ assignedTo: user._id });
      const completedCount = await Task.countDocuments({ assignedTo: user._id, status: 'done' });
      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedCount,
        completedCount,
        performance: assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0
      };
    }));

    res.json(teamData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Invite team member (Simulated)
// @route   POST /api/team/invite
exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    // In a real app, send email and create pending invite.
    // Here we'll just check if user exists or simulate success.
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found. They must sign up first in this demo." });
    }
    
    user.role = role || 'member';
    await user.save();

    res.json({ message: `Invitation sent to ${email}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Remove team member
// @route   DELETE /api/team/:id
exports.removeMember = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can remove members." });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Unassign tasks
    await Task.updateMany({ assignedTo: user._id }, { $unset: { assignedTo: 1 } });
    
    // In this simple app, we just "de-team" them by setting role to null or just removing if they aren't the creator
    // For now, let's just delete the user to simulate full removal
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Member removed from team" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
