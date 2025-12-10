// Establecer el año actual en el footer
document.getElementById("year").textContent = new Date().getFullYear();

// Inicializar el mapa
const map = L.map("map").setView([0, 0], 13);

// Añadir los tiles de OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; Contribuyentes de OpenStreetMap",
}).addTo(map);

// Generar plazas de aparcamiento aleatorias con dimensiones
function generarPlazasAleatorias(lat, lon, cantidad = 5) {
  const plazas = [];

  for (let i = 0; i < cantidad; i++) {
    // Colocación aleatoria ~300m alrededor
    const latAleatoria = lat + (Math.random() - 0.5) * 0.005;
    const lonAleatoria = lon + (Math.random() - 0.5) * 0.005;

    // Dimensiones aleatorias (tamaños realistas)
    const ancho = (2.0 + Math.random() * 0.6).toFixed(2); // 2.0–2.6 m
    const largo = (4.5 + Math.random() * 1.0).toFixed(2); // 4.5–5.5 m

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

// Añadir marcadores de aparcamiento al mapa
function agregarMarcadoresDeAparcamiento(plazas) {
  plazas.forEach((plaza) => {
    const urlGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${plaza.lat},${plaza.lon}`;

    const marcador = L.marker([plaza.lat, plaza.lon]).addTo(map);

    marcador.bindPopup(`
      <strong>${plaza.nombre}</strong><br>
      📏 Ancho: <strong>${plaza.ancho} m</strong><br>
      📐 Largo: <strong>${plaza.largo} m</strong><br><br>
      <a href="${urlGoogleMaps}" target="_blank">📍 Obtener direcciones</a>
    `);
  });
}

// Obtener ubicación del usuario
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      const lat = posicion.coords.latitude;
      const lon = posicion.coords.longitude;

      map.setView([lat, lon], 15);

      // Marcador de ubicación del usuario
      L.marker([lat, lon]).addTo(map).bindPopup("📍 Estás aquí").openPopup();

      // Generar y mostrar plazas de aparcamiento
      const plazas = generarPlazasAleatorias(lat, lon, 6);
      agregarMarcadoresDeAparcamiento(plazas);
    },
    () => {
      alert(
        "No se pudo obtener tu ubicación. Usando ubicación por defecto (Madrid)."
      );

      const lat = 40.4168;
      const lon = -3.7038;

      map.setView([lat, lon], 15);

      const plazas = generarPlazasAleatorias(lat, lon, 6);
      agregarMarcadoresDeAparcamiento(plazas);
    }
  );
} else {
  alert("Tu navegador no soporta geolocalización.");
}
