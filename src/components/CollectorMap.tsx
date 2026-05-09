import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Navigation } from 'lucide-react';

// Fix leaflet marker icon issue in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2764/2764432.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

interface CollectorMapProps {
  citizenLocation: [number, number];
  dispatchInfo: { start: [number, number]; dest: [number, number] } | null;
}

export default function CollectorMap({ citizenLocation, dispatchInfo }: CollectorMapProps) {
  const [truckPos, setTruckPos] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number>(0);

  useEffect(() => {
    if (!dispatchInfo) {
      setTruckPos(null);
      return;
    }

    // Set initial position to start
    setTruckPos(dispatchInfo.start);

    // Simulate truck moving towards destination
    const interval = setInterval(() => {
      setTruckPos((prev) => {
        if (!prev) return dispatchInfo.start;

        const latDiff = dispatchInfo.dest[0] - prev[0];
        const lngDiff = dispatchInfo.dest[1] - prev[1];
        
        // If close enough, don't move
        if (Math.abs(latDiff) < 0.0005 && Math.abs(lngDiff) < 0.0005) {
          setEta(0);
          return dispatchInfo.dest;
        }

        // Move 5% closer every 2 seconds
        const nextLat = prev[0] + latDiff * 0.05;
        const nextLng = prev[1] + lngDiff * 0.05;

        // Update ETA (simulated based on distance remaining)
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        const newEta = Math.max(1, Math.round(distance * 1000));
        setEta(newEta);

        return [nextLat, nextLng];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [dispatchInfo]);

  return (
    <div className="glass-panel p-6 mt-6 relative z-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-400" />
          Live Truck Tracking
        </h3>
        {!dispatchInfo ? (
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
             <span className="text-sm text-emerald-200/50 font-medium">Awaiting Dispatch</span>
           </div>
        ) : eta > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">ETA: {eta} min</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium">Arriving Now</span>
          </div>
        )}
      </div>

      <div className="w-full h-[300px] rounded-xl overflow-hidden border border-white/10 relative z-0">
        <MapContainer center={citizenLocation} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={citizenLocation}>
            <Popup>Your Location</Popup>
          </Marker>
          {truckPos && (
            <Marker position={truckPos} icon={truckIcon}>
              <Popup>Collector Truck</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
