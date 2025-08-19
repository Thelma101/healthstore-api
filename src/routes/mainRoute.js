const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const drugRoutes = require('./drugRoutes');
const categoryRoutes = require('./categoryRoute');


router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/drugs', drugRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;
