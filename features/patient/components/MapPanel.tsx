
import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Clinic } from '../../../types';
import { Crosshair, MapPin, X } from 'lucide-react';

const MapInvalidator = ({ showMap }: { showMap: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (showMap) {
        map.invalidateSize();
        const timer = setTimeout(() => { map.invalidateSize(); }, 300); 
        return () => clearTimeout(timer);
    }
  }, [showMap, map]);
  return null;
};

const MapUpdater: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => { map.flyTo(center, zoom); }, [center, zoom, map]);
    return null;
};

const MapClickHandler = ({ isActive, onLocationSelect }: { isActive: boolean, onLocationSelect: (latlng: L.LatLng) => void }) => {
    useMapEvents({ click(e) { if (isActive) { onLocationSelect(e.latlng); } }, });
    return null;
};

const DraggableUserMarker = ({ position, onDragEnd, icon }: { position: L.LatLngExpression, onDragEnd: (latlng: L.LatLng) => void, icon: L.DivIcon }) => {
    const markerRef = useRef<L.Marker>(null);
    const eventHandlers = useMemo(() => ({ dragend() { const marker = markerRef.current; if (marker != null) { onDragEnd(marker.getLatLng()); } }, }), [onDragEnd]);
    return (
        <Marker draggable={true} eventHandlers={eventHandlers} position={position} icon={icon} ref={markerRef} zIndexOffset={1000}>
            <Popup minWidth={90}>
                <div className="text-center"><div className="font-bold text-slate-800">Your Location</div><div className="text-xs text-slate-500">Drag to adjust</div></div>
            </Popup>
        </Marker>
    );
};

const createCustomIcon = (colorClass: string, waitTime: string, name: string) => {
    return L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center mb-1 drop-shadow-lg filter hover:z-[1000] cursor-pointer group transition-all duration-300 hover:scale-110 origin-bottom">
                <div class="px-2.5 py-1 ${colorClass} text-white text-[10px] font-bold rounded-full shadow-sm border border-white/20 mb-1 whitespace-nowrap min-w-[40px] text-center">${waitTime}m</div>
                <div class="px-3 py-1.5 bg-white rounded-lg shadow-md border-2 border-white max-w-[140px] text-center"><div class="text-[10px] font-bold text-slate-800 whitespace-nowrap truncate leading-tight">${name}</div></div>
                <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white -mt-[1px]"></div>
            </div>`,
        iconSize: [0, 0], iconAnchor: [0, 0], popupAnchor: [0, -35]
    });
};

const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="relative cursor-move"><div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-10"></div><div class="absolute top-0 left-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -10]
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
    return (
        <div className={`w-full md:w-[35%] h-full bg-slate-100 border-l border-slate-200 relative hidden md:block`}>
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className={isPickingLocation ? 'cursor-crosshair' : ''} style={{ height: '100%', width: '100%' }}>
                <MapInvalidator showMap={showMap} />
                <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <MapUpdater center={mapCenter} zoom={13} />
                <MapClickHandler isActive={isPickingLocation} onLocationSelect={onLocationSelect} />
                {userLocation && <DraggableUserMarker position={[userLocation.lat, userLocation.lng]} icon={userIcon} onDragEnd={onMarkerDragEnd} />}
                {clinics.map(clinic => {
                    if (!clinic.geoLocation) return null;
                    const waitInfo = getClinicWaitStats(clinic);
                    const icon = createCustomIcon(waitInfo.mapColor, waitInfo.raw, clinic.name);
                    return (
                        <Marker key={clinic.id} position={[clinic.geoLocation.lat, clinic.geoLocation.lng]} icon={icon} eventHandlers={{ click: () => onMarkerClick(clinic.id), }}>
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[180px]">
                                    <h3 className="font-bold text-sm mb-1">{clinic.name}</h3>
                                    <p className="text-xs text-slate-500 mb-2">{clinic.address}</p>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${waitInfo.mapColor}`}>{waitInfo.raw}m Wait</span>
                                        <button onClick={() => onBookClick(clinic.id)} className="text-xs bg-slate-900 text-white px-2 py-1 rounded font-bold hover:bg-slate-700">Book</button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            <button onClick={onLocateMe} className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 text-slate-700 active:scale-95 transition-transform" title="My Location">
                {isLocating ? <span className="animate-spin block h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full"></span> : <Crosshair className="h-5 w-5" />}
            </button>
            <div className="absolute bottom-24 md:bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-md text-[10px] space-y-1 z-[400]">
                <div className="font-bold mb-1">Live Wait Time</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Fast (0-20m)</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Moderate (20-45m)</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Busy (45m+)</div>
            </div>
            {isPickingLocation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2 cursor-pointer" onClick={onClosePickingLocation}>
                    <MapPin className="h-4 w-4 animate-bounce" /><span className="font-bold text-sm">Tap map to place pin</span><X className="h-4 w-4 ml-2 opacity-80" />
                </div>
            )}
        </div>
    );
};
