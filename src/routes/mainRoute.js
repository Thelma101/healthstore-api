const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoute');
const adminRoutes = require('./adminRoute');
const drugRoutes = require('./drugRoute');
const categoryRoutes = require('./categoryRoute');
const cartRoutes = require('./cartRoute');


router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/drugs', drugRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);

module.exports = router;
