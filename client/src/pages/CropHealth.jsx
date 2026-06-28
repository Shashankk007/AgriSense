import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, LayersControl } from 'react-leaflet';
import toast from 'react-hot-toast';
import { getFarmsAPI, saveFarmBoundaryAPI } from '../api/farmApi';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

if (typeof window !== 'undefined') {
  window.global = window;
}

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map zooming dynamically
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

// Vanilla Leaflet Draw Control Wrapper
const DrawControl = ({ onCreated, onEdited, onDeleted, featureGroupRef }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    if (featureGroupRef) {
      featureGroupRef.current = drawnItems;
    }
    
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems
      },
      draw: {
        polygon: {
          allowIntersection: true,
          showArea: true,
          shapeOptions: {
            color: '#f59e0b',
            weight: 3
          }
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
      }
    });
    
    map.addControl(drawControl);

    const handleCreated = (e) => {
      drawnItems.clearLayers(); // Only allow one at a time for farm boundary
      drawnItems.addLayer(e.layer);
      if (onCreated) onCreated(e);
    };

    const handleEdited = (e) => {
      if (onEdited) onEdited(e);
    };

    const handleDeleted = (e) => {
      if (onDeleted) onDeleted(e);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onCreated, onEdited, onDeleted, featureGroupRef]);

  return null;
};

const CropHealth = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  
  // Map State
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default India
  const [mapZoom, setMapZoom] = useState(5);

  // Drawing state
  const featureGroupRef = useRef();
  const [newPolygonCoords, setNewPolygonCoords] = useState(null);
  const [newFarmName, setNewFarmName] = useState("");
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Health data from GEE
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      const res = await getFarmsAPI();
      if(res && res.farms) {
        setFarms(res.farms);
      } else if (res && Array.isArray(res)) {
        setFarms(res);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load farms");
    }
  };

  const onFarmSelect = (farmId) => {
    const farm = farms.find(f => f._id === farmId);
    setSelectedFarm(farm);
    
    if(farm) {
      // Zoom to farm
      if (farm.boundary && farm.boundary.coordinates && farm.boundary.coordinates[0]) {
        const coords = farm.boundary.coordinates[0];
        // Calculate center of polygon
        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        setMapCenter([centerLat, centerLng]);
        setMapZoom(16);
      }
      loadHealthData(farm._id);
    } else {
      setHealthData(null);
    }
  };

  const loadHealthData = async (farmId) => {
    try {
      setIsLoading(true);
      const FAST_API_URL = import.meta.env.VITE_FAST_API_URL || "http://localhost:8000";
      const res = await axios.get(`${FAST_API_URL}/ndvi/${farmId}`);
      setHealthData(res.data);
      toast.success("Crop health data loaded!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to load NDVI data");
      setHealthData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Drawing Handlers ---
  const onCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const latlngs = layer.getLatLngs()[0];
      // Convert to GeoJSON format: [lng, lat]
      const coords = latlngs.map(latlng => [latlng.lng, latlng.lat]);
      // Close the loop
      coords.push([...coords[0]]);
      setNewPolygonCoords(coords);
      setIsDrawingMode(true);
    }
  };

  const onEdited = (e) => {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      const latlngs = layer.getLatLngs()[0];
      const coords = latlngs.map(latlng => [latlng.lng, latlng.lat]);
      coords.push([...coords[0]]);
      setNewPolygonCoords(coords);
    });
  };

  const onDeleted = () => {
    setNewPolygonCoords(null);
    setIsDrawingMode(false);
  };

  const handleSaveFarm = async () => {
    if (!newPolygonCoords || newPolygonCoords.length < 5) {
      return toast.error("Please draw a polygon with at least 4 corners!");
    }
    if (!newFarmName) {
      return toast.error("Please provide a name for the farm.");
    }
    
    try {
      setIsLoading(true);
      const res = await saveFarmBoundaryAPI(newFarmName, newPolygonCoords);
      toast.success("Farm saved successfully!");
      
      setNewPolygonCoords(null);
      setNewFarmName("");
      setIsDrawingMode(false);
      
      // Clear drawings from map
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }

      await fetchFarms();
      
      if(res && res.farm) {
        setSelectedFarm(res.farm);
        // Zoom to farm
        if (res.farm.boundary && res.farm.boundary.coordinates && res.farm.boundary.coordinates[0]) {
          const coords = res.farm.boundary.coordinates[0];
          const lats = coords.map(c => c[1]);
          const lngs = coords.map(c => c[0]);
          setMapCenter([(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2]);
          setMapZoom(16);
        }
        loadHealthData(res.farm._id);
      }
    } catch (err) {
      toast.error("Failed to save farm");
    } finally {
      setIsLoading(false);
    }
  };

  const goToCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading("Locating...", { id: 'locating' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setMapZoom(16);
          toast.success("Location found!", { id: 'locating' });
        },
        () => {
          toast.error("Geolocation failed or denied.", { id: 'locating' });
        }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col h-[90vh]">
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Crop Health Monitor</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">Draw and edit polygons. Save your farms and view satellite NDVI data.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={goToCurrentLocation}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            📍 My Location
          </button>

          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            onChange={(e) => onFarmSelect(e.target.value)}
            value={selectedFarm ? selectedFarm._id : ""}
          >
            <option value="">-- Select Saved Farm --</option>
            {farms.map(f => (
              <option key={f._id} value={f._id}>{f.farmName || f.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%' }}
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          <LayersControl position="topleft">
            <LayersControl.BaseLayer name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer checked name="Satellite (Hybrid)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Draw & Edit Tools */}
          <DrawControl 
            onCreated={onCreated}
            onEdited={onEdited}
            onDeleted={onDeleted}
            featureGroupRef={featureGroupRef}
          />

          {/* Render selected farm polygon always, but make fill transparent if NDVI is overlaid */}
          {selectedFarm && selectedFarm.boundary && (
            <Polygon 
              positions={selectedFarm.boundary.coordinates[0].map(coord => [coord[1], coord[0]])} 
              pathOptions={{ 
                color: 'white', 
                fillOpacity: healthData ? 0 : 0.2, 
                weight: 3 
              }} 
            />
          )}

          {/* Render GEE NDVI Tile */}
          {healthData && healthData.tileUrl && (
            <TileLayer 
              key={healthData.tileUrl}
              url={healthData.tileUrl} 
              zIndex={100} 
              opacity={0.8}
            />
          )}
        </MapContainer>

        {/* Save Drawing Overlay UI */}
        {isDrawingMode && newPolygonCoords && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white p-4 rounded-xl shadow-2xl border border-gray-200 w-80 flex flex-col gap-3">
            <h3 className="font-bold text-gray-900 border-b pb-2">Save New Farm</h3>
            <input 
              type="text" 
              placeholder="Enter Farm Name..."
              value={newFarmName}
              onChange={(e) => setNewFarmName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button 
              onClick={handleSaveFarm}
              disabled={isLoading || !newFarmName}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-bold disabled:bg-gray-400 transition-colors shadow-sm"
            >
              {isLoading ? "Saving..." : "Save Polygon"}
            </button>
          </div>
        )}

        {/* Health Data Legend & Results */}
        {healthData && (
          <div className="absolute bottom-6 right-6 z-[400] bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 w-80">
            <h3 className="font-extrabold text-lg text-gray-800 mb-1">{healthData.farmName}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Sentinel-2 Analysis • Area: {healthData.farmAreaHectares || 0} ha
            </p>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex-1 text-center shadow-inner">
                <p className="text-sm text-green-800 font-bold mb-1">Average NDVI</p>
                <p className="text-4xl font-black text-green-600 drop-shadow-sm">
                  {healthData.averageNdvi ? healthData.averageNdvi.toFixed(2) : "0.00"}
                </p>
              </div>
            </div>

            {/* Health Breakdown */}
            {healthData.health && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-600 mb-2">Health Breakdown</p>
                <div className="flex w-full h-3 rounded-full overflow-hidden shadow-inner mb-2">
                  <div style={{ width: `${healthData.health.healthyPercent}%` }} className="bg-green-600"></div>
                  <div style={{ width: `${healthData.health.moderatePercent}%` }} className="bg-yellow-400"></div>
                  <div style={{ width: `${healthData.health.poorPercent}%` }} className="bg-red-500"></div>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-green-700">{healthData.health.healthyPercent}% Good</span>
                  <span className="text-yellow-700">{healthData.health.moderatePercent}% Fair</span>
                  <span className="text-red-600">{healthData.health.poorPercent}% Poor</span>
                </div>
              </div>
            )}

            <div className="mb-2 mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs font-bold text-gray-600 mb-1.5">
                <span>0.0 (Poor)</span>
                <span>1.0 (Excellent)</span>
              </div>
              <div className="h-4 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 relative shadow-sm border border-gray-200">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-gray-800 rounded-full shadow-lg transition-all duration-500"
                  style={{ left: `${(healthData.averageNdvi || 0) * 100}%`, transform: 'translate(-50%, -50%)' }}
                ></div>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              Last Updated: {new Date(healthData.lastUpdated).toLocaleDateString()}
            </p>
          </div>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[500] bg-white/50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white px-8 py-5 rounded-2xl font-bold text-green-700 shadow-2xl flex items-center gap-4 border border-green-100">
              <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              Processing Request...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropHealth;
