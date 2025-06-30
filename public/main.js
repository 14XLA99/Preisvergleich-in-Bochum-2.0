// Firebase- und Leaflet-Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getAuth, signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // ──────────────────────────────
  // 1) Firebase initialisieren
  // ──────────────────────────────
  const firebaseConfig = {
    apiKey: "AIzaSyDlcUk04W7QOAjxA3PZPR2g-0pLW8Lt0I4",
    authDomain: "preisvergleich-bochum.firebaseapp.com",
    projectId: "preisvergleich-bochum",
    storageBucket: "preisvergleich-bochum.appspot.com",
    messagingSenderId: "702849481407",
    appId: "1:702849481407:web:5d704ee1082202d161640a"
  };
  const app  = initializeApp(firebaseConfig);
  const db   = getFirestore(app);
  const auth = getAuth(app);
  signInAnonymously(auth).catch(console.error);

  // ──────────────────────────────
  // 2) Leaflet-Karte initialisieren
  // ──────────────────────────────
  const map = L.map("map", {
    maxBounds: L.latLngBounds([51.35,7.05], [51.56,7.35]),
    maxBoundsViscosity: 1.0
  }).setView([51.4718,7.2162], 12);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    {
      attribution: '&copy; CARTO &copy; OSM',
      subdomains: "abcd",
      maxZoom: 19
    }
  ).addTo(map);

  // ──────────────────────────────
  // 3) Bezirksgrenzen (GeoJSON)
  // ──────────────────────────────
  const bezirksFarben = ["#cce5ff","#d4f4dd","#fff3bf","#ffdede","#f5e0ff","#e3f2fd"];

  fetch("/bochum_bezirke.geojson")
    .then(res => res.json())
    .then(data => {
      let idx = 0;
      L.geoJSON(data, {
        style: () => ({
          color: "#888",
          weight: 1,
          fillColor: bezirksFarben[(idx++) % bezirksFarben.length],
          fillOpacity: 0.4
        }),
        onEachFeature: (feature, layer) => {
          const name = feature.properties.Bezeichnun || "Unbenannt";
          layer.bindPopup(`<strong>${name}</strong>`);
          const center = layer.getBounds().getCenter();

          // Bezirksnamen als Marker über der Fläche
          L.marker(center, {
            icon: L.divIcon({
              className: "bezirk-label",
              html: `<div>${name}</div>`,
              iconSize: [100, 20],
              iconAnchor: [50, 10]
            }),
            interactive: false
          }).addTo(map);
        }
      }).addTo(map);
    });

  // ──────────────────────────────
  // 4) Marker-Icons (Standard & Grau)
  // ──────────────────────────────
  const normalIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  });

  const greyIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  });

  const popup = L.popup(); // Reuse-Popup für alle Marker

  // ————————————————————
// 5) Lokaler Speicher / App-State
// ————————————————————
let preisDaten = {};                  // { markt: { preise: {...}, bild: url } }
let currentMarker = null;            // Aktuell angeklickter Marker
let currentSupermarkt = "";          // Name des aktuellen Markts
let zwischenBildFile = null; // Neu gewähltes, noch nicht hochgeladenes Bild
let zuletztHochgeladenesBildURL = null;


  // ──────────────────────────────
  // 6) Produktdefinition (Stepper)
  // ──────────────────────────────
  const produkte = [
    { name: "Brot",   beschreibung: "Frisches Brot",      bildUrl: "https://www.kingarthurbaking.com/sites/default/files/styles/featured_image/public/2020-05/french-style-country-loaf.jpg" },
    { name: "Milch",  beschreibung: "1 l Vollmilch",       bildUrl: "https://m.media-amazon.com/images/I/41srjN9JNnL.jpg" },
    { name: "Äpfel",  beschreibung: "1 kg Äpfel",          bildUrl: "https://www.spargelbuffet.de/wp-content/uploads/2021/01/aepfel1.jpg" },
    { name: "Butter", beschreibung: "250 g Butter",        bildUrl: "https://www.hoche-butter.de/fileadmin/_processed_/c/4/csm_120086-Hoche-Uelzena-Paketbutter-Deutsche-Markenbutter-Buttergenuss-250g-800800_1854122865.png.pagespeed.ce.-BVqKQ7Smg.png;" },
    { name: "Nudeln", beschreibung: "500 g Nudeln",        bildUrl: "https://www.kelemidis.de/media/cache/73/9c/739ca90930ace806f2f6210ad9d92610.jpg" }
  ];

  let currentStep = 0;

  // ──────────────────────────────
  // 7) Stepper-Referenzen (DOM)
  // ──────────────────────────────
  const stepperModal = document.getElementById("stepperModal");
  const stepContent   = document.getElementById("step-content");
  const prevBtn       = document.getElementById("prevStep");
  const nextBtn       = document.getElementById("nextStep");
  const indicators    = document.getElementById("stepIndicators");
  const closeStepper  = document.getElementById("stepperCloseBtn");

// ————————————————————
// 8) Step anzeigen
// ————————————————————
function renderStep() {
  if (currentStep < produkte.length) {
    const p = produkte[currentStep];

    stepContent.innerHTML = `
      <div class="step-pane-content">
        <img src="${p.bildUrl}" alt="${p.name}">
        <div class="step-pane-text">
          <h3>${p.name}</h3>
          <p>${p.beschreibung}</p>
          <label>Preis (€):
            <input id="preisInput" type="number" step="0.01" value="${p.preisErfasst ?? ''}" />
          </label>
        </div>
      </div>
    `;
  } else {
    stepContent.innerHTML = `
      <h3>Belegfoto (optional)</h3>
      <input type="file" id="belegInput" accept="image/*" />
      <div id="belegPreview" style="margin-top:1em;"></div>
    `;

    const preview = document.getElementById("belegPreview");

if (zwischenBildFile) {
  const url = URL.createObjectURL(zwischenBildFile);
  preview.innerHTML = `
    <img src="${url}" style="max-width:100%;max-height:150px;border-radius:4px;">
    <div style="font-size:0.9em;color:#666;margin-top:4px;">(Wird beim Speichern hochgeladen)</div>
  `;
  setTimeout(() => URL.revokeObjectURL(url), 1000); // 🆕 Speicher freigeben
} else if (zuletztHochgeladenesBildURL) {
  preview.innerHTML = `
    <img src="${zuletztHochgeladenesBildURL}?t=${Date.now()}" style="max-width:100%;max-height:150px;border-radius:4px;">
  `;
} else {
  preview.innerHTML = `<p style="color:#888;font-size:0.9em;">(Kein Bild vorhanden)</p>`;
}


    document.getElementById("belegInput").addEventListener("change", evt => {
      zwischenBildFile = evt.target.files[0] || null;
      renderStep(); // neu zeichnen mit aktualisierter Vorschau
    });
  }

  indicators.innerHTML = "";
  const total = produkte.length + 1;
  for (let i = 0; i < total; i++) {
    const dot = document.createElement("div");
    dot.className = "step-dot" + (i === currentStep ? " active" : "");
    dot.onclick = () => { currentStep = i; renderStep(); };
    indicators.appendChild(dot);
  }
}

// ──────────────────────────────
// 9) Stepper öffnen / schließen / steuern (vollständig, mit Komprimierung und FormData)
// ──────────────────────────────
function openStepper() {
  currentStep = 0;
  renderStep();
  stepperModal.classList.remove("hidden");
}

closeStepper.onclick = () => stepperModal.classList.add("hidden");

prevBtn.onclick = () => {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
};

nextBtn.onclick = async () => {
  if (currentStep < produkte.length) {
    produkte[currentStep].preisErfasst =
      parseFloat(document.getElementById("preisInput").value) || null;
    currentStep++;
    renderStep();
  } else {
    let finaleBildUrl = zuletztHochgeladenesBildURL;

    if (zwischenBildFile) {
      nextBtn.disabled = true;
      nextBtn.textContent = "⏳ Bild wird hochgeladen...";

      const timestamp = Date.now();
      const safeName = currentSupermarkt.replace(/\W+/g, "_");
      const uniqueFileName = `${safeName}_${timestamp}.jpg`;

      let res, j;
      try {
        const compressedBlob = await compressImage(zwischenBildFile, 1024);

        const formData = new FormData();
        formData.append("file", compressedBlob, uniqueFileName);

        res = await fetch("/api/upload-image", {
          method: "POST",
          body: formData
        });
        j = await res.json();
      } catch (error) {
        console.error("❌ Upload fehlgeschlagen:", error);
        nextBtn.textContent = "❌ Netzwerkfehler beim Hochladen";
        nextBtn.disabled = false;
        return;
      }

      if (res.ok) {
        finaleBildUrl = j.url;

        const vorherigesBild = preisDaten[currentSupermarkt].bild;
        if (vorherigesBild) {
          const altDateiname = vorherigesBild.split("/").pop();
          await fetch("/api/delete-image", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: altDateiname })
          });
        }

        zuletztHochgeladenesBildURL = finaleBildUrl;
        preisDaten[currentSupermarkt].bild = finaleBildUrl;
        zwischenBildFile = null;
        nextBtn.textContent = "✅ Hochgeladen";
      } else {
        nextBtn.textContent = "❌ Fehler beim Hochladen";
      }
    }

    try {
      const neuePreise = {};
      produkte.forEach(p => neuePreise[p.name] = p.preisErfasst ?? null);

      await speicherePreisInFirestore(
        currentSupermarkt,
        neuePreise,
        finaleBildUrl
      );

      zuletztHochgeladenesBildURL = finaleBildUrl;
      preisDaten[currentSupermarkt].bild = finaleBildUrl;

      if (currentMarker) {
        popup
          .setLatLng(currentMarker.getLatLng())
          .setContent(setPopupContent(currentSupermarkt))
          .openOn(map);
        setPopupEventListeners();
      }

      stepperModal.classList.add("hidden");
      nextBtn.disabled = false;
      nextBtn.textContent = "Weiter";

    } catch (err) {
      console.error("❌ Fehler beim Speichern:", err);
      nextBtn.disabled = false;
      nextBtn.textContent = "Weiter";
    }
  }
};

  // ──────────────────────────────
  // 10) Daten aus Firestore laden
  // ──────────────────────────────
  async function ladePreiseAusFirestore() {
    const snapshot = await getDocs(collection(db, "preise"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.markt && data.preise) {
        preisDaten[data.markt] = {
          preise: data.preise,
          bild: data.bild || null
        };
      }
    });
    ladeSupermarktMarker();
  }

  // ──────────────────────────────
  // 11) Marker für Supermärkte setzen
  // ──────────────────────────────
  function ladeSupermarktMarker() {
    fetch("/supermaerkte.json")
      .then(res => res.json())
      .then(supermaerkte => {
        supermaerkte.forEach(markt => {
          const datenVorhanden = preisDaten[markt.name];
          const icon = datenVorhanden ? greyIcon : normalIcon;

          const marker = L.marker(markt.coords, { icon }).addTo(map);

          marker.on("click", () => {
            currentSupermarkt = markt.name;
            currentMarker     = marker;

            // Werte vorbefüllen
            const daten = preisDaten[markt.name] || {};
            zuletztHochgeladenesBildURL = daten.bild || null;
            zwischenBildFile = null; // 🆕 Reset für Stepper

            produkte.forEach(p => {
              p.preisErfasst = daten.preise?.[p.name] ?? null;
            });

            // Popup anzeigen
            popup
              .setLatLng(markt.coords)
              .setContent(setPopupContent(markt.name))
              .openOn(map);

            setPopupEventListeners();
          });
        });
      });
  }

  // ──────────────────────────────
  // 12) Popup-HTML generieren
  // ──────────────────────────────
  function setPopupContent(name) {
    const d = preisDaten[name] || {};
    let html = `<div style="margin-bottom:0.3em;"><strong style="font-size:1.1em;">${name}</strong></div>`;

    if (d.preise) {
      html += `<div style="font-size:0.9em;margin-bottom:0.5em;">` +
        Object.entries(d.preise).map(([produkt, wert]) =>
          `<div><b>${produkt}:</b> ${wert != null ? wert.toFixed(2) + " €" : "–"}</div>`
        ).join("") +
        `</div>`;
    } else {
      html += `<p>Keine Preise</p>`;
    }

    if (d.bild) {
      html += `
        <img src="${d.bild}?t=${Date.now()}" style="max-width:100%;max-height:150px;display:block;margin:0.5em 0;border-radius:4px;object-fit:contain;">
        <button id="bildLoeschenBtn" style="margin-bottom:0.5em;">🗑️ Bild löschen</button>
      `;
    }

    html += `<button id="bearbeitenBtn">Preise bearbeiten</button>`;
    return html;
  }

// ──────────────────────────────
// 13) Popup-Event-Logik
// ──────────────────────────────
function setPopupEventListeners() {
  const bearbeitenBtn = document.getElementById("bearbeitenBtn");
  if (bearbeitenBtn) bearbeitenBtn.onclick = openStepper;

  const loeschenBtn = document.getElementById("bildLoeschenBtn");
  if (loeschenBtn) {
    loeschenBtn.onclick = async () => {
      // Sofortiges Feedback + Button deaktivieren
      loeschenBtn.disabled = true;
      loeschenBtn.textContent = "⏳ Löschen...";

      const bildName = (preisDaten[currentSupermarkt].bild || "").split("/").pop();
      if (!bildName) return;

      // Bild bei Vercel löschen
      await fetch("/api/delete-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: bildName })
      });

      // Lokale Daten und Firestore aktualisieren
      preisDaten[currentSupermarkt].bild = null;
      await speicherePreisInFirestore(
        currentSupermarkt,
        preisDaten[currentSupermarkt].preise,
        null
      );

      // 🆕 Zustände für Stepper bereinigen
      zuletztHochgeladenesBildURL = null;
      zwischenBildFile = null;

      // Popup neu zeichnen + Events reaktivieren
      popup.setContent(setPopupContent(currentSupermarkt)).openOn(map);
      setPopupEventListeners();
    };
  }
}



  // ──────────────────────────────
  // 14) Firestore speichern
  // ──────────────────────────────
  async function speicherePreisInFirestore(markt, preise, bildURL = null) {
    await setDoc(
      doc(db, "preise", markt.replace(/\W+/g, "_")),
      {
        markt,
        preise,
        bild: bildURL || null,
        zeitstempel: serverTimestamp()
      }
    );
    preisDaten[markt] = { preise, bild: bildURL || null };

    // Marker-Icon ggf. grau einfärben
    if (currentMarker) currentMarker.setIcon(greyIcon);
  }
 // ──────────────────────────────
// 15) Datei komprimieren (JPEG)
// ──────────────────────────────
function compressImage(file, maxWidth = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.8);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}


  // ──────────────────────────────
  // 16) Map-Größe bei Rückkehr neu berechnen
  // ──────────────────────────────
  window.addEventListener("pageshow", () => map.invalidateSize());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) map.invalidateSize();
  });

  // ──────────────────────────────
  // 17) App starten
  // ──────────────────────────────
  ladePreiseAusFirestore(); // Startpunkt
});
 // ──────────────────────────────
// 18) Hilfsfunktion: Bild verkleinern (max 1024px)
 // ──────────────────────────────
async function compressImage(file, maxSize = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => resolve(blob),
        "image/jpeg",
        0.8 // Qualität (0-1)
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
