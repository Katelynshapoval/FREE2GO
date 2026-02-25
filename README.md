# FREE2GO

FREE2GO is a web-based parking assistant built with Leaflet that helps users find nearby parking spots, calculate routes, and navigate to the closest available space.

![FREE2GO Preview](/images/home.png)

## Features

- User geolocation with automatic fallback (Madrid).
- Address search using OpenStreetMap Nominatim (Spain).
- Randomly generated nearby parking spots.
- Automatic detection of the closest parking to the selected destination.
- Real-time route calculation using OSRM.
- Distance and estimated driving time from the user's location.
- Ability to delete a parking spot and automatically reroute.
- Interactive map with custom markers and popups.

## Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla)
- Leaflet.js
- Leaflet Routing Machine
- Leaflet Locate Control
- OpenStreetMap (Tiles + Nominatim)
- OSRM (Routing API)

## How It Works

1. The app requests the user’s geolocation.
2. The map centers on the user’s position.
3. When searching for an address:
   - The closest matching result is selected.
   - A destination marker is added.
   - Nearby parking spots are generated.
   - The closest parking spot is highlighted.
   - A route is created from the user to that parking space.
4. Users can:
   - View parking dimensions.
   - See estimated distance and time.
   - Generate a route to any parking spot.
   - Delete a parking spot (automatic rerouting if needed).

## Setup

1. Clone the repository.
2. Make sure the folder structure is preserved.
3. Open `index.html` in your browser.

No build tools or backend required.

## Notes

- Routing and geocoding rely on public OpenStreetMap services.
- This project is intended for educational and demonstration purposes.
