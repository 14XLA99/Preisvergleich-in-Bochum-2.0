// Karte initialisieren – zentriert auf Bochum
const map = L.map("map", {
  maxBounds: L.latLngBounds([51.42, 7.05], [51.56, 7.35]),  // Begrenzung auf Bochum
  minZoom: 11,
}).setView([51.4818, 7.2162], 12);

// Kartenhintergrund (OpenStreetMap Standard Layer)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

// Bezirksfarben definieren
const bezirksfarben = {
  "Bochum-Mitte": "#d0ebff",
  "Bochum-Nord": "#d3f9d8",
  "Bochum-Ost": "#fff3bf",
  "Bochum-Süd": "#ffe8cc",
  "Bochum-Südwest": "#eebefa",
  "Bochum-Wattenscheid": "#ffc9c9",
};

// Bezirke laden und darstellen
fetch("bezirke_bo.json")
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      style: function (feature) {
        return {
          color: "#888",
          weight: 1,
          fillColor: bezirksfarben[feature.properties.name] || "#e0e0e0",
          fillOpacity: 0.4,
        };
      },
      onEachFeature: function (feature, layer) {
        // Name zentriert als Marker einfügen
        const center = layer.getBounds().getCenter();
        const label = L.divIcon({
          className: "bezirk-label",
          html: `<div>${feature.properties.name}</div>`,
          iconSize: [100, 20],
          iconAnchor: [50, 10],
        });
        L.marker(center, { icon: label, interactive: false }).addTo(map);
      },
    }).addTo(map);
  });

// Preise aus dem lokalen Speicher laden
const preisDaten = JSON.parse(localStorage.getItem("preise") || "{}");

// Formular & Modal
const modal = document.getElementById("formModal");
const form = document.getElementById("priceForm");
const formTitle = document.getElementById("form-title");
const closeBtn = document.getElementById("closeBtn");

let currentMarker = null;
let currentSupermarkt = "";

// Hier kannst du später dynamisch Supermärkte einfügen
// Beispiel:
const supermaerkte = []; // leer – deine Daten aus der Excel können hier rein

// Marker setzen
supermaerkte.forEach((markt) => {
  const marker = L.marker(markt.coords).addTo(map);
  marker.bindPopup(`${markt.name}<br><em>Klick für Preiseingabe</em>`);

  marker.on("click", () => {
    currentSupermarkt = markt.name;
    currentMarker = marker;
    form.reset();
    formTitle.textContent = `Preise bei ${markt.name}`;
    modal.classList.remove("hidden");
  });

  if (preisDaten[markt.name]) {
    const produkte = preisDaten[markt.name];
    marker.bindPopup(
      `<b>${markt.name}</b><br>${Object.entries(produkte)
        .map(([prod, preis]) => `${prod}: ${preis.toFixed(2)} €`)
        .join("<br>")}<br><em>Klick für Bearbeiten</em>`
    );
  }
});

// Formular absenden
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const eintraege = {};
  ["Brot", "Milch", "Äpfel", "Butter", "Nudeln"].forEach((produkt) => {
    eintraege[produkt] = parseFloat(formData.get(produkt));
  });

  preisDaten[currentSupermarkt] = eintraege;
  localStorage.setItem("preise", JSON.stringify(preisDaten));

  currentMarker.setPopupContent(
    `<b>${currentSupermarkt}</b><br>${Object.entries(eintraege)
      .map(([prod, preis]) => `${prod}: ${preis.toFixed(2)} €`)
      .join("<br>")}<br><em>Klick für Bearbeiten</em>`
  );

  modal.classList.add("hidden");
});

// Modal schließen
closeBtn.onclick = () => modal.classList.add("hidden");
