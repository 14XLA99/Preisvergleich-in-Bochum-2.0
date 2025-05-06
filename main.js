// Map zentrieren 
const map = L.map("map", {
  maxBounds: L.latLngBounds([51.42, 7.05], [51.56, 7.35]),
  maxBoundsViscosity: 1.0, // Hält Karte innerhalb, aber ohne Rückschnappen
}).setView([51.4818, 7.2162], 12);


//Hintergrund Map
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

// Farbpalette für Bezirke
const bezirksFarben = [
  "#cce5ff", "#d4f4dd", "#fff3bf", "#ffdede", "#f5e0ff", "#e3f2fd"
];

// Stadtbezirke laden
fetch("bochum_bezirke.geojson")
  .then((res) => res.json())
  .then((data) => {
    let farbIndex = 0;
    L.geoJSON(data, {
      style: (feature) => {
        const farbe = bezirksFarben[farbIndex % bezirksFarben.length];
        farbIndex++;
        return {
          color: "#888",
          weight: 1,
          fillColor: farbe,
          fillOpacity: 0.4,
        };
      },
      onEachFeature: (feature, layer) => {
const bezirkName = feature.properties.Bezeichnun || "Unbenannt";

        // Popup
        layer.bindPopup(`<strong>${bezirkName}</strong>`);

        // Label zentriert im Bezirk
        const center = layer.getBounds().getCenter();
        const label = L.divIcon({
          className: "bezirk-label",
          html: `<div>${bezirkName}</div>`,
          iconSize: [100, 20],
          iconAnchor: [50, 10],
        });
        L.marker(center, { icon: label, interactive: false }).addTo(map);
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

// Marker aus externer Datei laden
fetch("supermaerkte.json")
  .then((res) => res.json())
  .then((daten) => {
    daten.forEach((markt) => {
      const marker = L.marker(markt.coords).addTo(map);

      marker.on("click", () => {
        currentSupermarkt = markt.name;
        currentMarker = marker;

        const preise = preisDaten[currentSupermarkt];
        let inhalt = "";

        if (preise) {
          inhalt = `
            <b>${markt.name}</b><br>
            ${Object.entries(preise)
              .map(([produkt, preis]) => `${produkt}: ${formatPreis(preis)}`)
              .join("<br>")}<br><br>
            <button id="bearbeitenBtn">🖊️ Preise bearbeiten</button>
          `;
        } else {
          inhalt = `
            <b>${markt.name}</b><br>
            Noch keine Preise vorhanden<br><br>
            <button id="bearbeitenBtn">➕ Preise eingeben</button>
          `;
        }

        // Wichtig: Popup schließen, um es neu zu erzeugen
        marker.closePopup();
        marker.bindPopup(inhalt).openPopup();

        // Listener nach kurzer Verzögerung setzen
        setTimeout(() => {
          const bearbeitenBtn = document.getElementById("bearbeitenBtn");
          if (bearbeitenBtn) {
            bearbeitenBtn.addEventListener("click", () => {
              form.reset();
              formTitle.textContent = `Preise bei ${markt.name}`;

              if (preise) {
                ["Brot", "Milch", "Äpfel", "Butter", "Nudeln"].forEach((produkt) => {
                  if (preise[produkt] != null) {
                    form.elements[produkt].value = preise[produkt];
                  }
                });
              }

              modal.classList.remove("hidden");
            });
          }
        }, 100);
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
// Modal schließen
closeBtn.onclick = () => modal.classList.add("hidden");
