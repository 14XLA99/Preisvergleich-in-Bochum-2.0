// Map zentrieren 
const map = L.map("map", {
  maxBounds: L.latLngBounds([51.35, 7.05], [51.56, 7.35]),
  maxBoundsViscosity: 1.0, // Hält Karte innerhalb, aber ohne Rückschnappen
}).setView([51.4718, 7.2162], 12);


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

// 🔥 Firebase SDK importieren
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 🔥 Firebase konfigurieren und initialisieren
const firebaseConfig = {
  apiKey: "AIzaSyDlcUk04W7QOAjxA3PZPR2g-0pLW8Lt0I4",
  authDomain: "preisvergleich-bochum.firebaseapp.com",
  projectId: "preisvergleich-bochum",
  storageBucket: "preisvergleich-bochum.appspot.com",
  messagingSenderId: "702849481407",
  appId: "1:702849481407:web:5d704ee1082202d161640a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Neue Funktion: Preis in Firestore speichern
async function speicherePreisInFirestore(markt, eintraege) {
  try {
    await addDoc(collection(db, "preise"), {
      markt: markt,
      preise: eintraege,
      zeitstempel: serverTimestamp()
    });
    console.log("✅ Preis in Firestore gespeichert");
  } catch (error) {
    console.error("❌ Fehler beim Speichern in Firestore:", error);
  }
}

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

// Neue Preis-Daten (werden befüllt)
const preisDaten = {};

async function ladePreiseAusFirestore() {
  const snapshot = await getDocs(collection(db, "preise"));
  snapshot.forEach((doc) => {
    preisDaten[doc.id] = doc.data(); // Supermarkt-Name als Key
  });

  // Jetzt Supermärkte laden, nachdem Daten da sind
  ladeSupermarktMarker();
}


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

// Farblich Marker ändern
const normalIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const greyIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const popup = L.popup(); // Zentral definiertes Popup

// Marker aus externer Datei
function ladeSupermarktMarker() {
fetch("supermaerkte.json")
  .then((res) => res.json())
  .then((daten) => {
    daten.forEach((markt) => {
      const hatPreise = preisDaten[markt.name]; // Prüfen ob schon Preise existieren

      // Marker mit passender Farbe erzeugen
      const marker = L.marker(markt.coords, {
        icon: hatPreise ? greyIcon : normalIcon,
      }).addTo(map);

      marker.on("click", () => {
        modal.classList.add("hidden"); // Modal schließen bei Wechsel

        currentSupermarkt = markt.name;
        currentMarker = marker;
        const preise = preisDaten[currentSupermarkt];

        // Popup-Inhalt generieren
        let content = `
          <b>${markt.name}</b><br>
          ${preise
            ? Object.entries(preise)
                .map(([produkt, preis]) => `${produkt}: ${formatPreis(preis)}`)
                .join("<br>")
            : "Noch keine Preise vorhanden"}
          <br><br>
          <button id="bearbeitenBtn">Preise ${preise ? "bearbeiten" : "eingeben"}</button>
        `;

        popup.setLatLng(markt.coords).setContent(content).openOn(map);

        // Button-Listener nachträglich setzen
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

    // Preise lokal speichern (wie gehabt)
  preisDaten[currentSupermarkt] = eintraege;
  localStorage.setItem("preise", JSON.stringify(preisDaten));

  // 🔥 Zusätzlich: Preise in Firebase Firestore speichern
  speicherePreisInFirestore(currentSupermarkt, eintraege);


  // Marker-Popup aktualisieren
  if (currentMarker) {
    currentMarker.setPopupContent(setPopupContent(currentSupermarkt));

    // Marker-Icon auf grau setzen (zeigt: Preise vorhanden)
    currentMarker.setIcon(greyIcon);
  }

  // Formular schließen
  modal.classList.add("hidden");
});

// Modal schließen
closeBtn.onclick = () => modal.classList.add("hidden");
// Modal schließen
closeBtn.onclick = () => modal.classList.add("hidden");

ladePreiseAusFirestore();
