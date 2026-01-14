import React, { useEffect, useState, createContext, useContext } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

// Create a context to share the location data with the app
interface LocationContextType {
  location: { lat: number; lng: number } | null;
}
const LocationContext = createContext<LocationContextType>({ location: null });
export const useUserLocation = () => useContext(LocationContext);

interface LocationEnforcerProps {
  children: React.ReactNode;
}

// Development mode bypass - uses mock location when geolocation fails in dev
// @ts-ignore - Vite provides import.meta.env
const DEV_MODE_BYPASS = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const MOCK_LOCATION = { lat: 12.9716, lng: 77.5946 }; // Bangalore, India

const LocationEnforcer: React.FC<LocationEnforcerProps> = ({ children }) => {
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [devBypassUsed, setDevBypassUsed] = useState(false);

  const useDevBypass = () => {
    if (DEV_MODE_BYPASS) {
      console.warn('🔧 DEV MODE: Using mock location (Bangalore, India) for testing');
      setUserLocation(MOCK_LOCATION);
      setLocationGranted(true);
      setDevBypassUsed(true);
      setLoading(false);
    }
  };

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationGranted(true);
        setLoading(false);
      },
      (err) => {
        // Error handling
        console.error("Geolocation error:", err);
        let errorMessage = "Location permission is mandatory to use this app.";
        
        switch(err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = "Location access was denied. Please enable Location Services in your browser or device settings to continue.";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = "Location information is unavailable. Please check your GPS signal.";
            break;
          case 3: // TIMEOUT
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  if (locationGranted) {
    return (
      <LocationContext.Provider value={{ location: userLocation }}>
        {children}
      </LocationContext.Provider>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#2563eb' }}>
          {error ? <AlertCircle size={48} color="#dc2626" /> : <MapPin size={48} />}
        </div>
        
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1f2937', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {error ? "Permission Required" : "Location Access"}
        </h2>
        
        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {error || "To find nearby clinics and manage your queue status effectively, we need access to your current location."}
        </p>

        <button
          onClick={requestLocation}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Detecting Location...' : 'Enable Location'}
        </button>
        
        {/* Dev mode bypass button - only shown in development */}
        {DEV_MODE_BYPASS && error && (
          <button
            onClick={useDevBypass}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              marginTop: '12px',
              transition: 'background-color 0.2s'
            }}
          >
            🔧 Dev Mode: Use Mock Location
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationEnforcer;