// Map zentrieren 
const map = L.map("map", {
  maxBounds: L.latLngBounds([51.35, 7.05], [51.56, 7.35]),
  maxBoundsViscosity: 1.0,
}).setView([51.4718, 7.2162], 12);

// Hintergrund-Karte
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

// Farben für Bezirke
const bezirksFarben = ["#cce5ff", "#d4f4dd", "#fff3bf", "#ffdede", "#f5e0ff", "#e3f2fd"];

// 🔥 Firebase-Importe
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc,       // NEU: Für setDoc
  setDoc,    // NEU: Für direktes Überschreiben
  getDocs, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const auth = getAuth(app);

signInAnonymously(auth)
  .then(() => {
    console.log("✅ Anonym angemeldet");
  })
  .catch((error) => {
    console.error("❌ Fehler bei anonymer Anmeldung:", error);
  });

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// 🔥 Firebase-Konfiguration
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
const storage = getStorage(app);

// Preise speichern – mit Überschreiben!
async function speicherePreisInFirestore(markt, eintraege, bildURL = null) {
  try {
    const marktId = markt.replace(/\W+/g, "_"); // Sonderzeichen entfernen → gültige ID
    await setDoc(doc(db, "preise", marktId), {
      markt: markt,
      preise: eintraege,
      zeitstempel: serverTimestamp(),
      bild: bildURL || null
    });
    console.log("✅ Preis in Firestore gespeichert (überschrieben)");
  } catch (error) {
    console.error("❌ Fehler beim Speichern in Firestore:", error);
  }
}

// Bezirke laden
fetch("/bochum_bezirke.geojson")
  .then((res) => res.json())
  .then((data) => {
    let farbIndex = 0;
    L.geoJSON(data, {
      style: () => {
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
        layer.bindPopup(`<strong>${bezirkName}</strong>`);
        const center = layer.getBounds().getCenter();
        const label = L.divIcon({
          className: "bezirk-label",
          html: `<div>${bezirkName}</div>`,
          iconSize: [100, 20],
          iconAnchor: [50, 10],
        });
        L.marker(center, {
          icon: label,
          interactive: false
        }).addTo(map);
      },
    }).addTo(map);
  });

// Lokale Preisdaten
const preisDaten = {};

// Preise aus Firestore laden
async function ladePreiseAusFirestore() {
  const snapshot = await getDocs(collection(db, "preise"));
  snapshot.forEach((doc) => {
    const daten = doc.data();
    if (daten.markt && daten.preise) {
      preisDaten[daten.markt] = daten.preise;
    }
  });
  ladeSupermarktMarker();
}

// Marker-Stile
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

const popup = L.popup();
let currentMarker = null;
let currentSupermarkt = "";

// Popup-Generator
const formatPreis = (val) => val != null ? `${val.toFixed(2)} €` : "-";

// Marker laden
function ladeSupermarktMarker() {
  fetch("/supermaerkte.json")
    .then((res) => res.json())
    .then((daten) => {
      daten.forEach((markt) => {
        const hatPreise = preisDaten[markt.name];
        const marker = L.marker(markt.coords, {
          icon: hatPreise ? greyIcon : normalIcon,
        }).addTo(map);

        marker.on("click", () => {
          modal.classList.add("hidden");

          currentSupermarkt = markt.name;
          currentMarker = marker;
          const preise = preisDaten[currentSupermarkt];

          popup
  .setLatLng(markt.coords)
  .setContent(setPopupContent(markt.name))
  .openOn(map);

setTimeout(() => {
  const btn = document.getElementById("bearbeitenBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      form.reset();
      formTitle.textContent = `Preise bei ${markt.name}`;
      const daten = preisDaten[markt.name];
      if (daten && daten.preise) {
        ["Brot", "Milch", "Äpfel", "Butter", "Nudeln"].forEach((produkt) => {
          if (daten.preise[produkt] != null) {
            form.elements[produkt].value = daten.preise[produkt];
          }
        });
      }
      modal.classList.remove("hidden");
    });
  }
}, 100);

          setTimeout(() => {
            const btn = document.getElementById("bearbeitenBtn");
            if (btn) {
              btn.addEventListener("click", () => {
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
}

// Formularelemente
const modal = document.getElementById("formModal");
const form = document.getElementById("priceForm");
const formTitle = document.getElementById("form-title");
const closeBtn = document.getElementById("closeBtn");

// Formular abschicken
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const eintraege = {};

  let fehltEtwas = false;

  ["Brot", "Milch", "Äpfel", "Butter", "Nudeln"].forEach((produkt) => {
    const wert = parseFloat(formData.get(produkt));
    if (isNaN(wert)) {
      fehltEtwas = true;
    }
    eintraege[produkt] = isNaN(wert) ? null : wert;
  });

  if (fehltEtwas) {
    alert("❗Bitte trage für alle Produkte einen Preis ein, bevor du speicherst.");
    return; // Abbrechen
  }

  // Bild
const bildDatei = form.elements["bild"].files[0];
let bildURL = null;

if (bildDatei) {
 const bildDatei = form.elements["bild"].files[0];
let bildURL = null;

if (bildDatei) {
  const base64Image = await fileToBase64(bildDatei);
  const fileName = `${currentSupermarkt}_${Date.now()}.jpg`;

  try {
    const res = await fetch("/api/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // "Authorization": "deinSicheresPasswort123" // (optional, wenn aktiviert)
      },
      body: JSON.stringify({
        imageBase64: base64Image,
        fileName: fileName,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      bildURL = result.url;
    } else {
      console.warn("⚠️ Fehler beim Hochladen des Bildes:", result.message);
    }
  } catch (err) {
    console.error("❌ Upload fehlgeschlagen:", err);
  }
}


// Einheitlich speichern
  preisDaten[currentSupermarkt] = {
    preise: eintraege,
    zeitstempel: new Date(),
    bild: bildURL || null
  };

  // Lokal speichern
  localStorage.setItem("preise", JSON.stringify(preisDaten));

  // Cloud speichern
  speicherePreisInFirestore(currentSupermarkt, eintraege, bildURL);

  // Überprüfung der Bild Speicherung 
  if (bildURL) {
  console.log("📷 Bild erfolgreich hochgeladen:", bildURL);
} else {
  console.warn("⚠️ Kein Bild-URL erhalten – Upload fehlgeschlagen?");
}

  // Marker aktualisieren
  if (currentMarker) {
    currentMarker.setIcon(greyIcon);

    // Popup aktualisieren und erneut öffnen
    popup
      .setLatLng(currentMarker.getLatLng())
      .setContent(setPopupContent(currentSupermarkt))
      .openOn(map);

  // Listener erneut setzen
setTimeout(() => {
  const bearbeitenBtn = document.getElementById("bearbeitenBtn");
  if (bearbeitenBtn) {
    bearbeitenBtn.addEventListener("click", () => {
      form.reset();
      formTitle.textContent = `Preise bei ${currentSupermarkt}`;
      const daten = preisDaten[currentSupermarkt];
      if (daten && daten.preise) {
        ["Brot", "Milch", "Äpfel", "Butter", "Nudeln"].forEach((produkt) => {
          if (daten.preise[produkt] != null) {
            form.elements[produkt].value = daten.preise[produkt];
          }
        });
      }
      modal.classList.remove("hidden");
    });
  }
}, 100); // korrekt geschlossen

modal.classList.add("hidden"); // ✅ gehört außerhalb vom setTimeout

});


function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Modal schließen
closeBtn.onclick = () => modal.classList.add("hidden");

// Popup-Inhalt erzeugen
const setPopupContent = (name) => {
  const daten = preisDaten[name];
  const preise = daten?.preise || daten; // unterstützt alte und neue Struktur
   const bildURL = daten?.bild;

  let content = `<b>${name}</b><br>`;
  if (preise && typeof preise === "object") {
     content += Object.entries(preise)
      .map(([prod, preis]) => `${prod}: ${formatPreis(preis)}`)
      .join("<br>");
  }

  if (bildURL) {
    content += `<br><br><img src="${bildURL}" alt="Beleg" style="max-width:200px; max-height:150px;">`;
  }

  content += `<br><br><button id="bearbeitenBtn">Preise bearbeiten</button>`;
  return content;
};

ladePreiseAusFirestore();


//Schlieren/Visuelle fehler entfernen 
// Hilfsfunktion zur vollständigen Aktualisierung
function refreshMap() {
  map.invalidateSize();

  // Trigger einen Redraw aller Layer (inkl. Marker)
  map.eachLayer((layer) => {
    if (layer._icon || layer._path) {
      if (layer._icon && layer._icon.style) {
        // Neuzeichnung erzwingen für Marker-Icons
        layer._icon.style.display = 'none';
        void layer._icon.offsetHeight; // Trigger Reflow
        layer._icon.style.display = '';
      }
      if (layer._path && layer.redraw) {
        // Falls SVG oder Vector Layer, neu rendern
        layer.redraw();
      }
    }
  });
}

// pageshow: beim Wiederbetreten
window.addEventListener("pageshow", () => {
  setTimeout(refreshMap, 100);
});

// wenn Sichtbarkeit wiederhergestellt wird
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    setTimeout(refreshMap, 100);
  }
});

