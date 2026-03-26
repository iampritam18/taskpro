const Project = require('../models/Project');
const Task = require('../models/Task');
const { createActivity } = require('./activityController');

// Create Project
exports.createProject = async (req, res) => {
  const { name, description, color, deadline } = req.body;

  try {
    const project = await Project.create({
      name,
      description,
      color,
      deadline,
      userId: req.user.id
    });

    await createActivity({
      user: req.user.id,
      type: 'project_created',
      description: `created project "${project.name}"`,
      project: project._id
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All User Projects (with task counts and sorting)
exports.getProjects = async (req, res) => {
  const { sort } = req.query;
  let sortCriteria = { isFavorite: -1, createdAt: -1 }; // Default: Favorites first, then newest

  if (sort === 'deadline') {
    sortCriteria = { isFavorite: -1, deadline: 1 };
  } else if (sort === 'oldest') {
    sortCriteria = { isFavorite: -1, createdAt: 1 };
  }

  try {
    const projects = await Project.find({ userId: req.user.id }).sort(sortCriteria);
    
    // Get task counts for each project
    const projectsWithStats = await Promise.all(projects.map(async (project) => {
      const tasks = await Task.find({ projectId: project._id });
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        ...project.toObject(),
        totalTasks,
        completedTasks,
        progress
      };
    }));

    res.json(projectsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Favorite Status
exports.toggleFavorite = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || project.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.isFavorite = !project.isFavorite;
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Project
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.query.id || req.params.id);
    if (!project || project.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const tasks = await Task.find({ projectId: project._id });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    
    res.json({
      ...project.toObject(),
      tasks,
      stats: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || project.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    await createActivity({
      user: req.user.id,
      type: 'project_updated',
      description: `updated project "${updatedProject.name}"`,
      project: updatedProject._id
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || project.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Unlink tasks from project
    await Task.updateMany({ projectId: project._id }, { $unset: { projectId: 1 } });
    
    await Project.deleteOne({ _id: project._id });
    res.json({ message: 'Project removed and tasks unlinked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
