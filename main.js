const map = L.map("map").setView([51.4818, 7.2162], 12); // Bochum-Zentrum

// Kartenlayer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap-Mitwirkende',
}).addTo(map);

// Bezirke laden
fetch("data/bochum_bezirke.geojson")
  .then((res) => res.json())
  .then((geojson) => {
    L.geoJSON(geojson, {
      style: {
        color: "#444",
        weight: 1,
        fillOpacity: 0.2,
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.name, { permanent: true });
      },
    }).addTo(map);
  });

// Supermärkte laden
fetch("data/supermaerkte_bo.json")
  .then((res) => res.json())
  .then((data) => {
    data.forEach((market) => {
      const marker = L.marker([market.lat, market.lon]).addTo(map);
      marker.bindPopup(generateForm(market.name));
    });
  });

// Formular-HTML
function generateForm(name) {
  return `
    <strong>${name}</strong>
    <form onsubmit="saveData(event, '${name}')">
      <label>Produkt 1: <input type="number" name="p1" required /></label>
      <label>Produkt 2: <input type="number" name="p2" required /></label>
      <label>Produkt 3: <input type="number" name="p3" required /></label>
      <label>Produkt 4: <input type="number" name="p4" required /></label>
      <label>Produkt 5: <input type="number" name="p5" required /></label>
      <button type="submit">Speichern</button>
    </form>
  `;
}

// Zwischenspeichern (lokal)
function saveData(e, name) {
  e.preventDefault();
  const form = e.target;
  const values = {
    p1: form.p1.value,
    p2: form.p2.value,
    p3: form.p3.value,
    p4: form.p4.value,
    p5: form.p5.value,
  };
  console.log("Gespeichert für", name, values);
  alert("Daten gespeichert für " + name);
}
