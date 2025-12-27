import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Clinic, PatientStatus } from '../../../types';
import { Crosshair, MapPin, X, Navigation, Calendar, Zap, Star, ChevronRight } from 'lucide-react';

const MapInvalidator = ({ showMap }: { showMap: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    
    const invalidate = () => {
        map.invalidateSize();
    };
    
    invalidate();
    const timers = [
        setTimeout(invalidate, 100),
        setTimeout(invalidate, 300),
        setTimeout(invalidate, 600)
    ];
    
    window.addEventListener('resize', invalidate);
    
    return () => {
        timers.forEach(t => clearTimeout(t));
        window.removeEventListener('resize', invalidate);
    };
  }, [showMap, map]);
  return null;
};

const MapUpdater: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => { 
        if (!map) return;
        if (center && !isNaN(center[0]) && !isNaN(center[1])) {
            map.setView(center, zoom, { animate: false }); 
        }
    }, [center, zoom, map]);
    return null;
};

const MapClickHandler = ({ isActive, onLocationSelect, onClearSelection }: { isActive: boolean, onLocationSelect: (latlng: L.LatLng) => void, onClearSelection: () => void }) => {
    useMapEvents({ 
        click(e) { 
            if (isActive) { 
                onLocationSelect(e.latlng); 
            } else {
                onClearSelection();
            }
        }, 
    });
    return null;
};

const DraggableUserMarker = ({ position, onDragEnd, icon }: { position: L.LatLngExpression, onDragEnd: (latlng: L.LatLng) => void, icon: L.DivIcon }) => {
    const markerRef = useRef<L.Marker>(null);
    const eventHandlers = useMemo(() => ({ 
        dragend() { 
            const marker = markerRef.current; 
            if (marker != null) { 
                onDragEnd(marker.getLatLng()); 
            } 
        }, 
    }), [onDragEnd]);
    
    return (
        <Marker 
            draggable={true} 
            eventHandlers={eventHandlers} 
            position={position} 
            icon={icon} 
            ref={markerRef} 
            zIndexOffset={1000}
        >
            <Popup minWidth={90}>
                <div className="text-center">
                    <div className="font-bold text-slate-800">Your Location</div>
                    <div className="text-xs text-slate-500">Drag to adjust</div>
                </div>
            </Popup>
        </Marker>
    );
};

const createCustomIcon = (colorClass: string, waitTime: string, name: string, isSelected: boolean) => {
    return L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center mb-1 drop-shadow-xl filter hover:z-[1000] cursor-pointer group transition-all duration-300 ${isSelected ? 'scale-125 z-[500]' : 'hover:scale-110'} origin-bottom">
                <div class="px-2.5 py-1 ${colorClass} text-white text-[10px] font-black rounded-full shadow-lg border-2 ${isSelected ? 'border-white' : 'border-white/40'} mb-1 whitespace-nowrap min-w-[40px] text-center">${waitTime}m</div>
                <div class="px-3 py-1.5 bg-white rounded-xl shadow-xl border-2 ${isSelected ? 'border-primary-500' : 'border-white'} max-w-[140px] text-center">
                    <div class="text-[10px] font-black text-slate-800 whitespace-nowrap truncate leading-tight">${name}</div>
                </div>
                <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${isSelected ? 'border-t-primary-500' : 'border-t-white'} -mt-[1px]"></div>
            </div>`,
        iconSize: [1, 1],
        iconAnchor: [0, 0], 
        popupAnchor: [0, -45]
    });
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="relative cursor-move"><div class="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-xl relative z-10"></div><div class="absolute top-0 left-0 w-5 h-5 bg-blue-500 rounded-full animate-ping opacity-75"></div></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]
});

interface MapPanelProps {
    clinics: Clinic[];
    userLocation: { lat: number; lng: number } | null;
    mapCenter: [number, number];
    isPickingLocation: boolean;
    isLocating: boolean;
    showMap: boolean;
    getClinicWaitStats: (clinic: Clinic) => any;
    onLocationSelect: (latlng: L.LatLng) => void;
    onMarkerDragEnd: (latlng: L.LatLng) => void;
    onLocateMe: () => void;
    onMarkerClick: (id: string) => void;
    onBookClick: (id: string) => void;
    onClosePickingLocation: () => void;
}

export const MapPanel: React.FC<MapPanelProps> = ({
    clinics, userLocation, mapCenter, isPickingLocation, isLocating, showMap,
    getClinicWaitStats, onLocationSelect, onMarkerDragEnd, onLocateMe, onMarkerClick, onBookClick, onClosePickingLocation
}) => {
    const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

    const initialCenter: [number, number] = useMemo(() => {
        // Fix: Corrected variable name from 'center' to 'mapCenter'
        if (mapCenter && !isNaN(mapCenter[0]) && !isNaN(mapCenter[1])) return mapCenter;
        return [13.0850, 80.2100];
    }, [mapCenter]);

    const selectedClinic = useMemo(() => 
        clinics.find(c => c.id === selectedClinicId),
    [selectedClinicId, clinics]);

    const selectedClinicWait = useMemo(() => 
        selectedClinic ? getClinicWaitStats(selectedClinic) : null
    , [selectedClinic, getClinicWaitStats]);

    const handleMarkerTap = (id: string) => {
        setSelectedClinicId(id);
        onMarkerClick(id);
    };

    return (
        <div className={`w-full md:w-[40%] flex-none h-[calc(100vh-5rem)] md:h-full bg-slate-200 border-l border-slate-200 relative z-0 md:static pb-0`}>
            <div className="absolute inset-0 md:relative md:h-full md:w-full">
                <MapContainer 
                    center={initialCenter} 
                    zoom={13} 
                    scrollWheelZoom={true} 
                    className={isPickingLocation ? 'cursor-crosshair h-full w-full' : 'h-full w-full'}
                    style={{ height: '100%', width: '100%' }}
                >
                    <MapInvalidator showMap={showMap} />
                    <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <MapUpdater center={mapCenter} zoom={13} />
                    <MapClickHandler 
                        isActive={isPickingLocation} 
                        onLocationSelect={onLocationSelect} 
                        onClearSelection={() => setSelectedClinicId(null)}
                    />
                    {userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng) && (
                        <DraggableUserMarker 
                            position={[userLocation.lat, userLocation.lng]} 
                            icon={userIcon} 
                            onDragEnd={onMarkerDragEnd} 
                        />
                    )}
                    {clinics.map(clinic => {
                        if (!clinic.geoLocation || isNaN(clinic.geoLocation.lat) || isNaN(clinic.geoLocation.lng)) return null;
                        const waitInfo = getClinicWaitStats(clinic);
                        const isSelected = selectedClinicId === clinic.id;
                        const icon = createCustomIcon(waitInfo.mapColor, waitInfo.raw, clinic.name, isSelected);
                        
                        // Calculate distance if user location is available
                        let distanceLabel = '';
                        if (userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
                            const distance = calculateDistance(userLocation.lat, userLocation.lng, clinic.geoLocation.lat, clinic.geoLocation.lng);
                            distanceLabel = `${distance.toFixed(1)} km away`;
                        }
                        
                        return (
                            <Marker 
                                key={clinic.id} 
                                position={[clinic.geoLocation.lat, clinic.geoLocation.lng]} 
                                icon={icon} 
                                eventHandlers={{ 
                                    click: () => handleMarkerTap(clinic.id),
                                }}
                                zIndexOffset={isSelected ? 1000 : 0}
                            >
                                <Popup className="custom-popup md:block hidden">
                                    <div className="p-1 min-w-[180px]">
                                        <h3 className="font-bold text-sm mb-1">{clinic.name}</h3>
                                        <p className="text-xs text-slate-500 mb-2">{clinic.address}</p>
                                        {distanceLabel && (
                                            <p className="text-xs text-blue-600 font-bold mb-2 flex items-center gap-1">
                                                <Navigation className="h-3 w-3" />
                                                {distanceLabel}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${waitInfo.mapColor}`}>{waitInfo.raw}m Wait</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onBookClick(clinic.id); }} 
                                                className="text-xs bg-slate-900 text-white px-2 py-1 rounded font-bold hover:bg-slate-700"
                                            >
                                                Book
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
            
            {/* UI Overlays */}
            <button onClick={onLocateMe} className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 text-slate-700 active:scale-95 transition-transform" title="My Location">
                {isLocating ? <span className="animate-spin block h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full"></span> : <Crosshair className="h-5 w-5" />}
            </button>
            
            {/* Legend - Desktop only or hidden on mobile when card is up */}
            {!selectedClinicId && (
                <div className="absolute bottom-24 md:bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-md text-[10px] space-y-1 z-[400] transition-opacity">
                    <div className="font-bold mb-1">Live Wait Time</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Fast (0-20m)</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Moderate (20-45m)</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Busy (45m+)</div>
                </div>
            )}
            
            {isPickingLocation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2 cursor-pointer" onClick={onClosePickingLocation}>
                    <MapPin className="h-4 w-4 animate-bounce" /><span className="font-bold text-sm">Tap map to place pin</span><X className="h-4 w-4 ml-2 opacity-80" />
                </div>
            )}

            {/* MOBILE QUICK BOOKING CARD */}
            {selectedClinic && (
                <div className="md:hidden fixed bottom-24 left-4 right-4 z-[500] animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden ring-1 ring-black/5">
                        <div className="p-5">
                            <div className="flex justify-between items-start gap-3 mb-4">
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black text-slate-900 leading-tight truncate">{selectedClinic.name}</h3>
                                    <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-1 truncate">
                                        <MapPin className="h-3 w-3 text-slate-400" /> {selectedClinic.address}
                                    </p>
                                    {userLocation && selectedClinic.geoLocation && (
                                        <p className="text-[11px] text-blue-600 font-bold flex items-center gap-1 mt-1">
                                            <Navigation className="h-3 w-3" />
                                            {calculateDistance(userLocation.lat, userLocation.lng, selectedClinic.geoLocation.lat, selectedClinic.geoLocation.lng).toFixed(1)} km away
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setSelectedClinicId(null)}
                                    className="p-1.5 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${selectedClinicWait?.bgColor} ${selectedClinicWait?.borderColor} shadow-sm`}>
                                    <div className={`w-2 h-2 rounded-full ${selectedClinicWait?.dotColor} animate-pulse`} />
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${selectedClinicWait?.textColor}`}>
                                        {selectedClinicWait?.raw}m Wait
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl border border-amber-100">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span className="text-[10px] font-black">4.8</span>
                                </div>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${selectedClinic.geoLocation?.lat},${selectedClinic.geoLocation?.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                                    title="Open in Google Maps"
                                >
                                    <Navigation className="h-3 w-3 fill-current" />
                                    <span className="text-[10px] font-black">Map</span>
                                </a>
                            </div>

                            <button 
                                onClick={() => onBookClick(selectedClinic.id)}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Zap className="h-5 w-5 fill-current" />
                                Book Appointment Now
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
