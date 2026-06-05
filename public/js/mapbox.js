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

export const initTourMap = () => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYmFoYWEyMDAxIiwiYSI6ImNsZXBqNncxaTA5NW4zem1qYWdjaTU0NWwifQ.EnFn3UivyEp2f9iXlWyr9w';

  const map = new mapboxgl.Map({
    container: 'map-container',
    style: 'mapbox://styles/bahaa2001/clevac25y000901p6izu54sva',
    center: [37.1357, 36.201],
    zoom: 9,
    interactive: true,
    maxBounds: [[-180, -90], [180, 90]],
  });

  window.addEventListener('resize', () => { map.resize(); });

  const markers = [];
  let isPicking = false;

  function exitPickingMode() {
    isPicking = false;
    try { map.getCanvas().style.cursor = ''; } catch (e) { /* map might not be ready */ }
    const instr = document.getElementById('map-instruction');
    if (instr) instr.style.display = 'none';
  }

  function addMarkerToMap(lng, lat, description, day) {
    const el = document.createElement('div');
    el.className = 'marker';
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<b>Day ${day}</b><br>${description || ''}`))
      .addTo(map);
    markers.push(marker);
  }

  function clearMapMarkers() {
    markers.forEach((m) => m.remove());
    markers.length = 0;
  }

  map.on('click', (e) => {
    if (!isPicking) return;
    const { lng, lat } = e.lngLat;
    const lngField = document.getElementById('loc-lng');
    const latField = document.getElementById('loc-lat');
    if (lngField && latField) {
      lngField.value = lng.toFixed(4);
      latField.value = lat.toFixed(4);
    }
    exitPickingMode();
  });

  return {
    startPicking() {
      if (isPicking) return;
      isPicking = true;
      try { map.getCanvas().style.cursor = 'crosshair'; } catch (e) { /* map might not be ready */ }
      const instr = document.getElementById('map-instruction');
      if (instr) instr.style.display = 'block';
    },
    isActive: true,
    addMarkerToMap,
    clearMapMarkers,
  };
};
