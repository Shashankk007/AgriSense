const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');
const authMiddleware = require('../middlewares/authMiddleware');

// authMiddleware lagane se ab ye protected route ban gaya hai
router.post('/save-boundary', authMiddleware, async (req, res) => {
  try {
    const { farmName, coordinates } = req.body;

    if (!coordinates || coordinates.length === 0) {
      return res.status(400).json({ success: false, message: 'Coordinates are required.' });
    }

    const newFarm = new Farm({
      farmName: farmName || 'My AgriSense Farm',
      userId: req.user.id, // Ye token se decode hoke aaya hai
      boundary: {
        type: 'Polygon',
        coordinates: [coordinates] 
      }
    });

    await newFarm.save();
    res.status(201).json({ success: true, message: 'Farm boundary saved successfully!', data: newFarm });

  } catch (error) {
    console.error("Error saving boundary:", error);
    res.status(500).json({ success: false, message: 'Server error while saving boundary.' });
  }
});

module.exports = router;