let closestParkingMarker = null;

// --- FOOTER YEAR ---
document.getElementById("year").textContent = new Date().getFullYear();

// --- ICONS ---
const userIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const closestParkingIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const parkingIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// --- GLOBAL STATE ---
let routingControl = null;
let parkingMarkers = [];
window.userLocation = null;

// --- MAP INIT ---
const map = L.map("map").setView([0, 0], 13);

// --- TILE LAYER ---
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// --- LOCATE BUTTON ---
L.control
  .locate({
    position: "topleft",
    flyTo: true,
    strings: { title: "Mostrar mi ubicación" },
  })
  .addTo(map);

// --- RANDOM PARKING SPOTS ---
function generarPlazasAleatorias(lat, lon, cantidad = 6) {
  const plazas = [];
  for (let i = 0; i < cantidad; i++) {
    const latA = lat + (Math.random() - 0.5) * 0.004;
    const lonA = lon + (Math.random() - 0.5) * 0.004;

    plazas.push({
      lat: latA,
      lon: lonA,
      nombre: `Plaza ${i + 1}`,
      ancho: (2 + Math.random() * 0.6).toFixed(2),
      largo: (4.5 + Math.random()).toFixed(2),
    });
  }
  return plazas;
}

// --- CLEAR PARKING ---
function limpiarMarcadores() {
  parkingMarkers.forEach((m) => map.removeLayer(m));
  parkingMarkers = [];
}

// --- DELETE A PARKING SPOT ---
function eliminarPlaza(lat, lon) {
  const markerIndex = parkingMarkers.findIndex(
    (m) => m.getLatLng().lat === lat && m.getLatLng().lng === lon
  );

  if (markerIndex === -1) return;

  // Remove marker from map
  map.removeLayer(parkingMarkers[markerIndex]);

  // Remove from array
  parkingMarkers.splice(markerIndex, 1);

  console.log("Plaza eliminada:", lat, lon);
}

// --- ADD PARKING ---
function agregarMarcadoresDeAparcamiento(plazas, closestParking) {
  plazas.forEach((plaza) => {
    const isClosest =
      closestParking &&
      plaza.lat === closestParking.lat &&
      plaza.lon === closestParking.lon;

    const marker = L.marker([plaza.lat, plaza.lon], {
      icon: isClosest ? closestParkingIcon : parkingIcon,
    }).addTo(map);

    parkingMarkers.push(marker);

    marker.bindPopup(`
  <strong>${plaza.nombre}${isClosest ? " ⭐ (más cercano)" : ""}</strong><br>
  📏 Ancho: ${plaza.ancho} m<br>
  📐 Largo: ${plaza.largo} m<br><br>

  <button onclick="crearRuta(${plaza.lat}, ${plaza.lon})">
    🧭 Ruta hasta aquí
  </button><br><br>

  <button onclick="eliminarPlaza(${plaza.lat}, ${plaza.lon})"
          style="background:#d93025;color:white;padding:6px 10px;border:none;border-radius:6px;cursor:pointer;">
    ❌ Eliminar plaza
  </button>
`);
  });
}

// --- ROUTING ---
function crearRuta(destLat, destLon) {
  if (!window.userLocation) {
    alert("Ubicación del usuario no disponible.");
    return;
  }

  // Remove previous route
  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(window.userLocation.lat, window.userLocation.lon),
      L.latLng(destLat, destLon),
    ],
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
      language: "es",
    }),
    showAlternatives: false,
    lineOptions: { styles: [{ color: "purple", weight: 5 }] }, // PURPLE ROUTE
    createMarker: () => null,
  }).addTo(map);
}

// --- SET USER LOCATION ---
function establecerUbicacionUsuario(lat, lon) {
  window.userLocation = { lat, lon };
  map.setView([lat, lon], 15);

  L.marker([lat, lon], { icon: userIcon })
    .addTo(map)
    .bindPopup("📍 Estás aquí")
    .openPopup();

  const plazas = generarPlazasAleatorias(lat, lon, 6);
  agregarMarcadoresDeAparcamiento(plazas);
}

// --- SEARCH FUNCTION ---
async function buscarDireccion() {
  const address = document.getElementById("addressInput").value;
  if (!address) return;

  if (!window.userLocation) {
    alert("Ubicación del usuario aún no está disponible.");
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=es&q=${encodeURIComponent(
    address
  )}`;

  const res = await fetch(url);
  const results = await res.json();

  if (results.length === 0) {
    alert("No se encontró ninguna coincidencia.");
    return;
  }

  // --- HAVERSINE ---
  function distance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // Pick closest match
  const closestDest = results.reduce(
    (best, place) => {
      const dist = distance(
        Number(window.userLocation.lat),
        Number(window.userLocation.lon),
        Number(place.lat),
        Number(place.lon)
      );
      return dist < best.dist ? { place, dist } : best;
    },
    { place: null, dist: Infinity }
  ).place;

  const destLat = Number(closestDest.lat);
  const destLon = Number(closestDest.lon);

  map.setView([destLat, destLon], 15);

  // --- GREEN DESTINATION MARKER ---
  if (window.destinationMarker) map.removeLayer(window.destinationMarker);

  window.destinationMarker = L.marker([destLat, destLon], {
    icon: destinationIcon,
  })
    .addTo(map)
    .bindPopup("📍 Destino seleccionado")
    .openPopup();

  // CLEAR OLD PARKING
  limpiarMarcadores();

  // GENERATE NEW PARKINGS
  const parkings = generarPlazasAleatorias(destLat, destLon, 6);

  // FIND CLOSEST PARKING
  const closestParking = parkings.reduce(
    (best, p) => {
      const dist = distance(destLat, destLon, p.lat, p.lon);
      return dist < best.dist ? { spot: p, dist } : best;
    },
    { spot: null, dist: Infinity }
  ).spot;

  // ADD PARKING MARKERS
  agregarMarcadoresDeAparcamiento(parkings, closestParking);

  // ROUTE USER → CLOSEST PARKING
  crearRuta(closestParking.lat, closestParking.lon);

  // OPEN POPUP
  const marker = parkingMarkers.find(
    (m) =>
      m.getLatLng().lat === closestParking.lat &&
      m.getLatLng().lng === closestParking.lon
  );
  if (marker) marker.openPopup();
}

// --- BUTTON LISTENERS ---
document.getElementById("searchBtn").addEventListener("click", buscarDireccion);
document.getElementById("addressInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") buscarDireccion();
});

// --- INITIAL LOCATION ---
navigator.geolocation.getCurrentPosition(
  (pos) =>
    establecerUbicacionUsuario(pos.coords.latitude, pos.coords.longitude),
  () => establecerUbicacionUsuario(40.4168, -3.7038) // fallback Madrid
);
