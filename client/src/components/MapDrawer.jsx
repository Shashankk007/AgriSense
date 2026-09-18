import React, { useState, useEffect, useCallback, useContext } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw-next';
import { saveFarmBoundaryAPI } from '../api/farmApi';
import { AuthContext } from '../context/AuthContext'; 

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const MapDrawer = ({ farmName = 'My Farm', onFarmSaved, overlayTileUrl }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [featureGroupInstance, setFeatureGroupInstance] = useState(null);
  
  // 👈 Memory se user ka data nikala
  const { user } = useContext(AuthContext); 

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  const setFeatureGroupRef = useCallback((instance) => {
    if (instance) setFeatureGroupInstance(instance);
  }, []);

  const onCreated = async (e) => {
    // Verify if user is logged in before allowing them to save the boundary
    if (!user) {
      alert("Please log in to save your farm boundary!");
      e.layer.remove(); // Remove the drawn layer immediately if user is not logged in
      return;
    }

    const { layerType, layer } = e;
    if (layerType !== 'polygon') return;

    // Farm names must be unique per user, so let the user choose one.
    const chosenName = window.prompt('Name this farm:', farmName)?.trim();
    if (!chosenName) {
      layer.remove();
      return;
    }

    // Convert the drawn polygon's latlngs to the format required by our backend (GeoJSON-like)
    const coordinates = layer.getLatLngs()[0].map(latlng => [latlng.lng, latlng.lat]);
    coordinates.push(coordinates[0]); // Close the polygon by repeating the first coordinate at the end

    try {
      // API call to save the boundary securely in the database
      const saved = await saveFarmBoundaryAPI(chosenName, coordinates);
      console.log('Boundary saved API Response:', saved);
      onFarmSaved?.(saved.farm || saved.data || saved);
      alert("✅ Farm boundary securely saved to database!");
    } catch (err) {
      console.error('Failed to save boundary:', err);
      layer.remove();
      alert(`❌ ${err?.response?.data?.message || 'Failed to save boundary. Please try again.'}`);
    }
  };

  if (!mapLoaded) return null;

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Select Farm Area</h2>
        
        {/* User Login Status */}
        {!user && (
          <span className="text-sm font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
            Login required to draw & save
          </span>
        )}
      </div>

      <div className="h-100 w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
        <MapContainer
          key="map-container"
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {overlayTileUrl && <TileLayer key={overlayTileUrl} url={overlayTileUrl} opacity={0.75} />}

          <FeatureGroup ref={setFeatureGroupRef}>
            {featureGroupInstance && (
              <EditControl
                position="topright"
                featureGroup={featureGroupInstance}
                draw={{
                  rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  // Only allow polygon drawing if user is logged in
                  polygon: !!user 
                }}
                onCreated={onCreated}
              />
            )}
          </FeatureGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapDrawer;