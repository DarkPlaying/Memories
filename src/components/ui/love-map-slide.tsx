"use client";

import { useEffect } from "react";
import { Map, MapMarker, MarkerContent, MapArc, useMap } from "./mapcn-map-arc";

// Inline controller to animate map flight from global view to marked locations
function MapFlyController() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (isLoaded && map) {
      // Set initial globe view coordinates
      map.setZoom(1.5);
      map.setCenter([30, 25]);
      
      const timer = setTimeout(() => {
        map.flyTo({
          center: [80.18, 13.08],
          zoom: 10.5,
          essential: true,
          duration: 3500, // 3.5 seconds smooth transition
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [map, isLoaded]);

  return null;
}

export default function LoveMapSlide() {
  const mainCoords: [number, number] = [80.0978, 13.1770];
  const arcData = [
    { id: "arc-1", from: mainCoords, to: [80.0814, 13.1718] as [number, number] }, // Avadi Morai
    { id: "arc-2", from: mainCoords, to: [80.2199, 12.9674] as [number, number] }, // WorkEZ Helix Velachery
    { id: "arc-3", from: mainCoords, to: [80.1715, 13.1667] as [number, number] }, // Puzhal Lake
    { id: "arc-4", from: mainCoords, to: [80.1980, 13.1700] as [number, number] }, // Thiruneelakanda Nagar
    { id: "arc-5", from: mainCoords, to: [80.2072, 13.1006] as [number, number] }, // Rail Museum
    { id: "arc-6", from: mainCoords, to: [80.2837, 13.0542] as [number, number] }, // Marina Beach
  ];

  return (
    <div className="w-full h-full relative flex flex-col p-4 sm:p-6 gap-2">
      <div className="text-center mt-2 z-20">
        <h3 className="text-white font-playfair font-bold text-lg md:text-xl">Our Love Map</h3>
        <p className="text-gray-300 text-xs mt-1 font-outfit">Mapping our memorable locations from Avadi & Puzhal to WorkEZ Helix & Marina Beach.</p>
      </div>
      <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl bg-neutral-950 min-h-[220px]">
        <Map
          theme="dark"
          center={[30, 25]}
          zoom={1.5}
          projection={{ type: "globe" }}
        >
          <MapFlyController />
          <MapArc
            data={arcData}
            curvature={0.2}
            paint={{
              "line-color": "#3b82f6",
              "line-width": 2,
              "line-opacity": 0.8,
            }}
          />
          {/* 1. Vel Tech Arts College (Main Location) */}
          <MapMarker longitude={80.0978} latitude={13.1770}>
            <MarkerContent>
              <div className="flex flex-col items-center">
                <div className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded shadow border border-amber-300 whitespace-nowrap mb-1 font-outfit animate-pulse">
                  ⭐ Vel Tech Arts College (Main) 🎓
                </div>
                <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white animate-bounce shadow-[0_0_12px_#f59e0b]" />
              </div>
            </MarkerContent>
          </MapMarker>

          {/* 2. Avadi Moorai */}
          <MapMarker longitude={80.0814} latitude={13.1718}>
            <MarkerContent>
              <div className="flex flex-col items-center">
                <div className="bg-rose-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow border border-white/10 whitespace-nowrap mb-1 font-outfit">
                  Avadi Morai 🏡
                </div>
                <div className="w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </MarkerContent>
          </MapMarker>

          {/* 3. WorkEZ Helix Velachery */}
          <MapMarker longitude={80.2199} latitude={12.9674}>
            <MarkerContent>
              <div className="flex flex-col items-center">
                <div className="bg-pink-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow border border-white/10 whitespace-nowrap mb-1 font-outfit">
                  WorkEZ Helix (Velachery) 🏢
                </div>
                <div className="w-3 h-3 bg-pink-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </MarkerContent>
          </MapMarker>

          {/* 4. Puzhal Lake */}
          <MapMarker longitude={80.1715} latitude={13.1667}>
            <MarkerContent>
              <div className="flex flex-col items-center">
                <div className="bg-sky-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow border border-white/10 whitespace-nowrap mb-1 font-outfit">
                  Puzhal Lake 🌊
                </div>
                <div className="w-3 h-3 bg-sky-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </MarkerContent>
          </MapMarker>

          {/* 5. Thiruneelakanda Nagar 3rd street puzhal */}
          <MapMarker longitude={80.1980} latitude={13.1700}>
            <MarkerContent>
              <div className="flex flex-col items-center">
                <div className="bg-purple-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow border border-white/10 whitespace-nowrap mb-1 font-outfit">
                  Thiruneelakanda Nagar 📍
                </div>
                <div className="w-3 h-3 bg-purple-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </MarkerContent>
          </MapMarker>

          {/* 6. Toy train station - Chennai Rail Museum */}
          <MapMarker longitude={80.2072} latitude={13.1006}>
            <MarkerContent>
              <div className="flex flex-col items-center">
                <div className="bg-teal-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow border border-white/10 whitespace-nowrap mb-1 font-outfit">
                  Rail Museum 🚂
                </div>
                <div className="w-3 h-3 bg-teal-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </MarkerContent>
          </MapMarker>

          {/* 7. Marina Beach */}
          <MapMarker longitude={80.2837} latitude={13.0542}>
            <MarkerContent>
              <div className="flex flex-col items-center">
                <div className="bg-emerald-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow border border-white/10 whitespace-nowrap mb-1 font-outfit">
                  Marina Beach 🏖️
                </div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </MarkerContent>
          </MapMarker>
        </Map>
      </div>
    </div>
  );
}
