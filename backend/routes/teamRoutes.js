const express = require('express');
const router = express.Router();
const { getTeam, inviteMember, removeMember } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTeam);
router.post('/invite', protect, inviteMember);
router.delete('/:id', protect, removeMember);

module.exports = router;
