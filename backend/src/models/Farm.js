const mongoose = require('mongoose');

// Define the schema for storing farm boundaries using GeoJSON format
const farmSchema = new mongoose.Schema({
  farmName: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'], // Strictly defining the shape as a Polygon
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of arrays of numbers: [[[longitude, latitude]]]
      required: true
    }
  }
}, { timestamps: true });

// Create a 2dsphere index to enable geospatial queries in the future
farmSchema.index({ boundary: '2dsphere' });

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;