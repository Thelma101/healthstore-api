const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoute');
const adminRoutes = require('./userRoute');
const drugRoutes = require('./drugRoute');
const categoryRoutes = require('./categoryRoute');
const cartRoutes = require('./cartRoute');
const orderRoutes = require('./orderRoute');
const prescriptionRoutes = require('./prescriptionRoute');
const dashboardStats = require('./dashboardRoute');


router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/drugs', drugRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders' , orderRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/dashboard', dashboardStats);

module.exports = router;
