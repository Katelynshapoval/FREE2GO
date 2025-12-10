let closestParkingMarker = null;
let currentRouteTarget = null;

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
async function eliminarPlaza(lat, lon) {
  // FIND MARKER
  const index = parkingMarkers.findIndex(
    (m) => m.getLatLng().lat === lat && m.getLatLng().lng === lon
  );

  if (index === -1) return;

  // REMOVE MARKER FROM MAP
  map.removeLayer(parkingMarkers[index]);
  parkingMarkers.splice(index, 1);

  // IF DELETED PARKING WAS USED FOR ROUTE
  // IF DELETED PARKING WAS USED FOR ROUTE
  if (
    currentRouteTarget &&
    currentRouteTarget.lat === lat &&
    currentRouteTarget.lon === lon
  ) {
    console.log("Deleted active parking — rerouting...");

    if (parkingMarkers.length === 0) {
      if (routingControl) map.removeControl(routingControl);
      currentRouteTarget = null;
      return;
    }

    // FIND NEXT CLOSEST PARKING (Haversine)
    const destLat = window.destinationMarker.getLatLng().lat;
    const destLon = window.destinationMarker.getLatLng().lng;

    function distance(aLat, aLon, bLat, bLon) {
      const R = 6371;
      const dLat = ((bLat - aLat) * Math.PI) / 180;
      const dLon = ((bLon - aLon) * Math.PI) / 180;
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((aLat * Math.PI) / 180) *
          Math.cos((bLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    let closestMarker = null;
    let closestDist = Infinity;

    parkingMarkers.forEach((marker) => {
      const mLat = marker.getLatLng().lat;
      const mLon = marker.getLatLng().lng;
      const d = distance(destLat, destLon, mLat, mLon);

      if (d < closestDist) {
        closestDist = d;
        closestMarker = marker;
      }
    });

    // ⭐ RECOLOR ALL MARKERS
    recolorearParkings(
      closestMarker.getLatLng().lat,
      closestMarker.getLatLng().lng
    );

    // ⭐ CREATE NEW ROUTE
    crearRuta(closestMarker.getLatLng().lat, closestMarker.getLatLng().lng);

    closestMarker.openPopup();
  }
}

function recolorearParkings(nuevoLat, nuevoLon) {
  parkingMarkers.forEach((marker) => {
    const { lat, lng } = marker.getLatLng();

    if (lat === nuevoLat && lng === nuevoLon) {
      marker.setIcon(closestParkingIcon); // Make purple
    } else {
      marker.setIcon(parkingIcon); // Make grey
    }
  });
}

// --- GET DISTANCE & TIME FROM USER VIA OSRM ---
async function obtenerRutaUsuario(lat, lon) {
  if (!window.userLocation) return null;

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${window.userLocation.lon},${window.userLocation.lat};${lon},${lat}` +
    `?overview=false&alternatives=false&steps=false`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes || !data.routes[0]) return null;

    const route = data.routes[0];
    return {
      distanciaKm: (route.distance / 1000).toFixed(2),
      duracionMin: Math.round(route.duration / 60),
    };
  } catch (e) {
    console.error("Error fetching OSRM route:", e);
    return null;
  }
}

// --- ADD PARKING ---
async function agregarMarcadoresDeAparcamiento(plazas, closestParking) {
  for (const plaza of plazas) {
    const isClosest =
      closestParking &&
      plaza.lat === closestParking.lat &&
      plaza.lon === closestParking.lon;

    // CREATE MARKER
    const marker = L.marker([plaza.lat, plaza.lon], {
      icon: isClosest ? closestParkingIcon : parkingIcon,
    }).addTo(map);

    parkingMarkers.push(marker);

    // FETCH DISTANCE + TIME FROM USER
    const info = await obtenerRutaUsuario(plaza.lat, plaza.lon);

    let distanciaTexto = "Calculando...";
    let duracionTexto = "";

    if (info) {
      distanciaTexto = `🛣 ${info.distanciaKm} km`;
      duracionTexto = `⏱ ${info.duracionMin} min`;
    }

    // POPUP
    marker.bindPopup(`
      <strong>${plaza.nombre}${
      isClosest ? " ⭐ (más cercano)" : ""
    }</strong><br>
      📏 Ancho: ${plaza.ancho} m<br>
      📐 Largo: ${plaza.largo} m<br><br>

      <strong>Desde tu ubicación:</strong><br>
      ${distanciaTexto}<br>
      ${duracionTexto}<br><br>

      <button onclick="crearRuta(${plaza.lat}, ${plaza.lon})">
        🧭 Ruta hasta aquí
      </button><br><br>

      <button onclick="eliminarPlaza(${plaza.lat}, ${plaza.lon})"
        style="background:#d93025;color:white;padding:6px 10px;
        border:none;border-radius:6px;cursor:pointer;">
        ❌ Eliminar plaza
      </button>
    `);
  }
}

// --- ROUTING ---
function crearRuta(destLat, destLon) {
  if (!window.userLocation) {
    alert("Ubicación del usuario no disponible.");
    return;
  }

  // Save which parking we are routing to
  currentRouteTarget = { lat: destLat, lon: destLon };

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
    lineOptions: { styles: [{ color: "purple", weight: 5 }] },
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
