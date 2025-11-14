const express = require('express');
const { getUsers, createUser } = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.use(auth);

router.route('/')
  .get(getUsers)
  .post(createUser);

module.exports = router;
