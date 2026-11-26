import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';
import type { CollectorLocation } from '../api/api';

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
  citizenLocation?: [number, number];
  locations?: CollectorLocation[];
}

function MapBounds({ locations }: { locations: CollectorLocation[] }) {
  const map = useMap();
  const hasFittedBounds = useRef(false);

  useEffect(() => {
    if (locations.length === 0) {
      hasFittedBounds.current = false;
      return;
    }
    if (hasFittedBounds.current) return;

    const bounds = L.latLngBounds(
      locations.map((collector) => [collector.location.lat, collector.location.lng])
    );
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    hasFittedBounds.current = true;
  }, [locations, map]);

  return null;
}

function locationAge(updatedAt?: string): { label: string; className: string } {
  if (!updatedAt) return { label: 'Unavailable', className: 'text-slate-400' };
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  if (!Number.isFinite(ageMs) || ageMs > 60_000) {
    return { label: 'Stale', className: 'text-amber-400' };
  }
  return { label: 'Fresh', className: 'text-[#48B9F5]' };
}

export default function CollectorMap({ citizenLocation, locations = [] }: CollectorMapProps) {
  const center: [number, number] | null = citizenLocation
    || (locations.length > 0 ? [locations[0].location.lat, locations[0].location.lng] : null);

  return (
    <div className="glass-panel p-6 mt-6 relative z-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-[#48B9F5]" />
          Live Truck Tracking
        </h3>
        <span className="text-sm text-[#8A9AAF]">Polling every 4 seconds</span>
      </div>

      {center ? (
        <div className="w-full h-[300px] rounded-xl overflow-hidden border border-white/10 relative z-0">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <MapBounds locations={locations} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {citizenLocation && (
              <Marker position={citizenLocation}>
                <Popup>Your Location</Popup>
              </Marker>
            )}
            {locations.map((collector) => {
              const status = locationAge(collector.location.updatedAt);
              return (
                <Marker key={collector.id} position={[collector.location.lat, collector.location.lng]} icon={truckIcon}>
                  <Popup>
                    <strong>{collector.name}</strong>
                    <br />
                    <span className={status.className}>{status.label}</span>
                    <br />
                    {collector.location.lat.toFixed(5)}, {collector.location.lng.toFixed(5)}
                    {collector.location.updatedAt && (
                      <><br />Updated {new Date(collector.location.updatedAt).toLocaleString()}</>
                    )}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      ) : (
        <div className="h-[180px] flex items-center justify-center rounded-xl border border-white/10 text-sm text-white/40">
          No usable Collector location is available yet.
        </div>
      )}
    </div>
  );
}
