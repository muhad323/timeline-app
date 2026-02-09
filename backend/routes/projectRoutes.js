const express = require('express');
const router = express.Router();
const { getProjects, createProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getProjects);
router.post('/', protect, createProject);

module.exports = router;
