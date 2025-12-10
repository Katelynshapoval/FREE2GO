// Set current year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Initialize the map
const map = L.map("map").setView([40.4168, -3.7038], 13); // Madrid coordinates

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Add a marker
L.marker([40.4168, -3.7038])
  .addTo(map)
  .bindPopup("Aquí está FREE2GO!")
  .openPopup();
