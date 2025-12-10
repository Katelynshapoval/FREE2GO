// Establecer el año actual en el footer
document.getElementById("year").textContent = new Date().getFullYear();

// Custom red icon for the user's location
const userIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ROUTING CONTROL HOLDER
let routingControl = null;

// Inicializar el mapa
const map = L.map("map").setView([0, 0], 13);

// Añadir tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Generate parking spots
function generarPlazasAleatorias(lat, lon, cantidad = 5) {
  const plazas = [];

  for (let i = 0; i < cantidad; i++) {
    const latAleatoria = lat + (Math.random() - 0.5) * 0.005;
    const lonAleatoria = lon + (Math.random() - 0.5) * 0.005;

    const ancho = (2.0 + Math.random() * 0.6).toFixed(2);
    const largo = (4.5 + Math.random() * 1.0).toFixed(2);

    plazas.push({
      lat: latAleatoria,
      lon: lonAleatoria,
      nombre: `Plaza de Aparcamiento ${i + 1}`,
      ancho,
      largo,
    });
  }

  return plazas;
}

// Add parking markers
function agregarMarcadoresDeAparcamiento(plazas) {
  plazas.forEach((plaza) => {
    const marcador = L.marker([plaza.lat, plaza.lon]).addTo(map);

    marcador.bindPopup(`
      <strong>${plaza.nombre}</strong><br>
      📏 Ancho: <strong>${plaza.ancho} m</strong><br>
      📐 Largo: <strong>${plaza.largo} m</strong><br><br>
      <button onclick="crearRuta(${plaza.lat}, ${plaza.lon})">
        🧭 Ruta hasta aquí
      </button>
    `);
  });
}

// ROUTE GENERATOR
function crearRuta(destLat, destLon) {
  if (!window.userLocation) {
    alert("Ubicación del usuario no disponible.");
    return;
  }

  if (routingControl) {
    map.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(window.userLocation.lat, window.userLocation.lon),
      L.latLng(destLat, destLon),
    ],
    routeWhileDragging: false,
    lineOptions: {
      styles: [{ color: "#008cff", weight: 5 }],
    },
  }).addTo(map);
}

// GEOCODING: Search address → route
async function buscarDireccion() {
  const address = document.getElementById("addressInput").value;
  if (!address) return;

  if (!window.userLocation) {
    alert("Ubicación del usuario aún no está disponible.");
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;

  const response = await fetch(url);
  const results = await response.json();

  if (results.length === 0) {
    alert("No se encontraron coincidencias.");
    return;
  }

  // Function to calculate distance (Haversine)
  function distance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // Pick the closest result to user
  const closest = results.reduce(
    (closestSoFar, place) => {
      const dist = distance(
        window.userLocation.lat,
        window.userLocation.lon,
        place.lat,
        place.lon
      );
      return dist < closestSoFar.dist ? { place, dist } : closestSoFar;
    },
    { place: null, dist: Infinity }
  ).place;

  // Start the route
  crearRuta(closest.lat, closest.lon);
}

// Handle search button
document.getElementById("searchBtn").addEventListener("click", buscarDireccion);
document.getElementById("addressInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") buscarDireccion();
});

// Obtain user location
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      const lat = posicion.coords.latitude;
      const lon = posicion.coords.longitude;

      window.userLocation = { lat, lon };

      map.setView([lat, lon], 15);

      L.marker([lat, lon], { icon: userIcon })
        .addTo(map)
        .bindPopup("📍 Estás aquí")
        .openPopup();

      const plazas = generarPlazasAleatorias(lat, lon, 6);
      agregarMarcadoresDeAparcamiento(plazas);
    },
    () => {
      alert("No se pudo obtener tu ubicación.");
    }
  );
}
