import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Truck, Map as MapIcon, Leaf, Zap } from "lucide-react";

// Fix for default Leaflet marker icons not showing in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Calculate emissions based on distance (km) and vehicle type
const EMISSION_FACTORS = {
  diesel_truck: 0.65, // kg CO2 per km
  electric_truck: 0.15, // kg CO2 per km (based on grid average)
  van: 0.25, // kg CO2 per km
  cargo_bike: 0.01, // kg CO2 per km
};

type VehicleType = keyof typeof EMISSION_FACTORS;

// A React-Leaflet component that accesses the map instance to add the routing control
function RoutingControl({ 
  setDistance, 
  setDuration 
}: { 
  setDistance: (d: number) => void,
  setDuration: (d: number) => void
}) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Default route from New York to Boston as an example
    const waypoints = [
      L.latLng(40.7128, -74.0060), // NY
      L.latLng(42.3601, -71.0589)  // Boston
    ];

    const control = L.Routing.control({
      waypoints,
      routeWhileDragging: true,
      showAlternatives: true,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#16a34a', weight: 6, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      altLineOptions: {
        styles: [{ color: '#64748b', weight: 4, opacity: 0.6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      }
    }).addTo(map);

    // Listen for routes found event
    control.on('routesfound', function(e: any) {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const summary = routes[0].summary;
        // summary.totalDistance is in meters, summary.totalTime is in seconds
        setDistance(summary.totalDistance / 1000); // km
        setDuration(summary.totalTime / 60); // minutes
      }
    });

    routingControlRef.current = control;

    return () => {
      if (map && routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, setDistance, setDuration]);

  return null;
}

export default function RouteOptimization() {
  const [vehicle, setVehicle] = useState<VehicleType>("diesel_truck");
  const [distance, setDistance] = useState(0); // km
  const [duration, setDuration] = useState(0); // minutes

  const emissions = distance * EMISSION_FACTORS[vehicle];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MapIcon className="h-8 w-8 text-green-600" />
          Route Optimization
        </h2>
        <p className="text-muted-foreground">
          Plan logistics and minimize transport emissions by calculating real-time carbon costs for your routes.
          <br/>
          <span className="text-xs text-green-600 font-medium">* Drag the start and end markers on the map to calculate new routes.</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Stats and Controls */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-green-600/20 shadow-md">
            <CardHeader className="pb-3 break-words">
              <CardTitle>Fleet Settings</CardTitle>
              <CardDescription>Select the vehicle type for this route to estimate emissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={vehicle} onValueChange={(v: VehicleType) => setVehicle(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel_truck">Standard Heavy Diesel Truck</SelectItem>
                      <SelectItem value="electric_truck">Electric Heavy Cargo Truck</SelectItem>
                      <SelectItem value="van">Delivery Van</SelectItem>
                      <SelectItem value="cargo_bike">Urban Cargo Bike</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapIcon className="h-4 w-4" /> Distance
                  </span>
                  <span className="text-3xl font-bold">{distance.toFixed(1)} <span className="text-base font-normal text-muted-foreground">km</span></span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Truck className="h-4 w-4" /> Est. Time
                  </span>
                  <span className="text-3xl font-bold">{Math.round(duration / 60)}<span className="text-base font-normal text-muted-foreground">h</span> {Math.round(duration % 60)}<span className="text-base font-normal text-muted-foreground">m</span></span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={`border-2 shadow-md transition-colors ${vehicle === 'electric_truck' || vehicle === 'cargo_bike' ? 'bg-green-50/50 border-green-500/50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-800'}`}>
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-5 p-4">
                {vehicle === 'electric_truck' ? <Zap className="h-24 w-24" /> : <Leaf className="h-24 w-24 text-green-500" />}
              </div>
              <div className="flex flex-col space-y-2 relative z-10">
                <span className="text-sm font-medium text-muted-foreground">Total Carbon Emissions</span>
                <span className="text-5xl font-extrabold tracking-tighter text-foreground">
                  {emissions.toFixed(1)} <span className="text-xl font-medium text-muted-foreground tracking-normal">kg CO₂e</span>
                </span>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on a general factor of {EMISSION_FACTORS[vehicle]} kg CO2/km for the selected vehicle.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Map */}
        <div className="md:col-span-2 h-[600px] rounded-xl overflow-hidden border shadow-lg relative z-0">
          <MapContainer 
            center={[41.53, -72.53]} // Somewhere between NY and Boston
            zoom={7} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RoutingControl setDistance={setDistance} setDuration={setDuration} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
