/* eslint-disable*/
import mapboxgl from 'mapbox-gl';

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYmFoYWEyMDAxIiwiYSI6ImNsZXBqNncxaTA5NW4zem1qYWdjaTU0NWwifQ.EnFn3UivyEp2f9iXlWyr9w';
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/bahaa2001/clevac25y000901p6izu54sva',
    // scrollZoom: false,
    // center: [-118.315192, 34.006905],
    // zoom: 5,
    interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // Add marker
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup()
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 200, left: 100, right: 100 },
  });
};

export const ss = () => {
  // Set your Mapbox access token
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYmFoYWEyMDAxIiwiYSI6ImNsZXBqNncxaTA5NW4zem1qYWdjaTU0NWwifQ.EnFn3UivyEp2f9iXlWyr9w';

  // Initialize the Mapbox map
  const map = new mapboxgl.Map({
    container: 'map-container', // ID of the map container
    style: 'mapbox://styles/bahaa2001/clevac25y000901p6izu54sva',
    center: [37.1357, 36.201], // Default center [lng, lat]
    zoom: 9, // Default zoom level
    interactive: true, // Enable map interactions
    maxBounds: [
      [-180, -90], // Southwest coordinates
      [180, 90], // Northeast coordinates
    ], // Constrain the map to the specified bounds
  });

  // Ensure the map resizes properly when the window is resized
  window.addEventListener('resize', () => {
    map.resize();
  });

  // Handle map click events
  map.on('click', (event) => {
    const coordinates = event.lngLat;
    const popup = new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setText(`${coordinates.lng.toFixed(4)}, ${coordinates.lat.toFixed(4)}`)
      .addTo(map);

    // Update the form field with the selected coordinates
    document.querySelector(
      '#startLocationCoordinates'
    ).value = `${coordinates.lng.toFixed(4)}, ${coordinates.lat.toFixed(4)}`;
  });
};
