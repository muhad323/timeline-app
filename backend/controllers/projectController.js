const Project = require('../models/Project');

// @desc    Get all projects for logged-in user
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ user: req.userData.userId }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
};

// @desc    Create new project
exports.createProject = async (req, res) => {
    try {
        const { name, client, scale, startDate, tasks, milestones, holidays } = req.body;

        const project = new Project({
            user: req.userData.userId,
            name,
            client,
            scale,
            startDate,
            tasks,
            milestones,
            holidays
        });

        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};

// @desc    Update project
exports.updateProject = async (req, res) => {
    try {
        const { name, client, scale, startDate, tasks, milestones, holidays } = req.body;

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, user: req.userData.userId },
            { name, client, scale, startDate, tasks, milestones, holidays },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

// @desc    Delete project
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.userData.userId });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};
