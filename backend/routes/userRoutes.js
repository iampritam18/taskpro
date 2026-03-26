const express = require('express');
const router = express.Router();
const { getTeamMembers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/team', protect, getTeamMembers);

module.exports = router;
