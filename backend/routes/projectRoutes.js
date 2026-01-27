const express = require('express');
const router = express.Router();
const {
    getProjects,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projectController');
const auth = require('../middleware/authMiddleware');

// Get all projects for logged-in user
router.get('/', auth, getProjects);

// Create project
router.post('/', auth, createProject);

// Update project
router.put('/:id', auth, updateProject);

// Delete project
router.delete('/:id', auth, deleteProject);

module.exports = router;
