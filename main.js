// Grundkarte zentriert auf Bochum
const map = L.map("map").setView([51.4818, 7.2162], 12);

L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

// Stadtbezirke laden
fetch("bochum_bezirke.geojson")
  .then((res) => res.json())
  .then((data) => {
    L.geoJSON(data, {
      style: () => ({
        color: "#00458a",
        weight: 2,
        fillColor: "#cce5ff",
        fillOpacity: 0.25,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
      },
    }).addTo(map);
  });

// Preis-Daten aus localStorage
const preisDaten = JSON.parse(localStorage.getItem("preise") || "{}");

// DOM-Elemente
const modal = document.getElementById("formModal");
const form = document.getElementById("priceForm");
const formTitle = document.getElementById("form-title");
const closeBtn = document.getElementById("closeBtn");

let currentMarker = null;
let currentSupermarkt = "";

// Preis formatieren
const formatPreis = (val) => (val != null ? `${val.toFixed(2)} €` : "-");

// Popup-Inhalt generieren
const setPopupContent = (name) => {
  const preise = preisDaten[name];
  if (preise) {
    return `<b>${name}</b><br>${Object.entries(preise)
      .map(([prod, preis]) => `${prod}: ${formatPreis(preis)}`)
      .join("<br>")}<br><em>Klick für Bearbeiten</em>`;
  }
  return `${name}<br><em>Klick für Preiseingabe</em>`;
};

// Marker aus externer Datei laden (z. B. supermaerkte.json)
fetch("supermaerkte.json")
  .then((res) => res.json())
  .then((daten) => {
    daten.forEach((markt) => {
      const marker = L.marker(markt.coords).addTo(map);
      marker.bindPopup(setPopupContent(markt.name));

      marker.on("click", () => {
        currentSupermarkt = markt.name;
        currentMarker = marker;
        form.reset();
        formTitle.textContent = `Preise bei ${markt.name}`;
        modal.classList.remove("hidden");
      });
    });
  });

// Formular absenden
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const eintraege = {};

  ["Brot", "Milch", "Äpfel", "Butter", "Nudeln"].forEach((produkt) => {
    const wert = parseFloat(formData.get(produkt));
    eintraege[produkt] = isNaN(wert) ? null : wert;
  });

  preisDaten[currentSupermarkt] = eintraege;
  localStorage.setItem("preise", JSON.stringify(preisDaten));

  if (currentMarker) {
    currentMarker.setPopupContent(setPopupContent(currentSupermarkt));
  }

  modal.classList.add("hidden");
});

// Modal schließen
closeBtn.onclick = () => modal.classList.add("hidden");
