// Grundkarte zentriert auf Bochum
const map = L.map("map").setView([51.4818, 7.2162], 12);

// Kartenhintergrund
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

// Bezirke (werden dynamisch aus GeoJSON geladen)
fetch("bezirke_bo.json")
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      style: function (feature) {
        return {
          color: "#00458a",
          weight: 2,
          fillColor: "#cce5ff",
          fillOpacity: 0.25,
        };
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
      },
    }).addTo(map);
  });

// Beispiel-Supermärkte
const supermaerkte = [
  { name: "Rewe Gerthe", coords: [51.5286, 7.2507] },
  { name: "Aldi Wattenscheid", coords: [51.4815, 7.1422] },
  { name: "Lidl Innenstadt", coords: [51.4762, 7.2170] },
  { name: "Edeka Querenburg", coords: [51.4474, 7.2615] },
  { name: "Netto Langendreer", coords: [51.4833, 7.3184] },
];

// Preis-Daten laden
const preisDaten = JSON.parse(localStorage.getItem("preise") || "{}");

// Modal/DOM-Elemente
const modal = document.getElementById("formModal");
const form = document.getElementById("priceForm");
const formTitle = document.getElementById("form-title");
const closeBtn = document.getElementById("closeBtn");

let currentMarker = null;
let currentSupermarkt = "";

// Supermarkt-Marker
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
