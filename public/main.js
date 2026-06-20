// Firebase- und Leaflet-Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getAuth, signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getProduktVergleicheFuerMarkt } from "./produktmatrix.js";

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

// Popup: nicht schließen beim Klicken im Popup, großzügiges Auto-Pan
const popup = L.popup({
  autoPan: true,
  autoPanPaddingTopLeft: [20, 120],
  autoPanPaddingBottomRight: [20, 40],
  closeOnClick: true,   // Klick auf Karte schließt Popup
  autoClose: true,
  maxWidth: 320,
  closeButton: true,
  className: "price-popup"
});

  // Beim Schließen Zustand zurücksetzen -> nächstes Öffnen wieder kompakt
map.on("popupclose", () => {
  if (currentSupermarkt) {
    popupState[currentSupermarkt] = { expanded: false, showImage: false };
  }
});

  // ————————————————————
// 5) Lokaler Speicher / App-State
// ————————————————————
let preisDaten = {}; // { markt: { preise: {...}, bild: url, groessen: {...} } }
// Popup-Zustand pro Markt
const popupState = {}; // { [marktName]: { expanded: boolean, showImage: boolean } }}
// Oberkategorie aus Produktnamen ableiten (oder pair.kategorie nutzen, wenn vorhanden)
function getPairCategory(pair){
  if (pair.kategorie) return pair.kategorie;
  const ns = `${pair.p1?.name||""} ${pair.p2?.name||""}`.toLowerCase();

  if (/cola|coke/.test(ns)) return "Cola";
  if (/banan/.test(ns)) return "Bananen";
  if (/joghurt|yogurt/.test(ns)) return "Joghurt";
  if (/reis|basmati/.test(ns)) return "Reis";
  if (/margarine|rama/.test(ns)) return "Margarine";

  if (/nutella|nougat|nuss.*nougat/.test(ns)) return "Nuss-Nougat-Creme";
  if (/schoko|schokolade|milka/.test(ns)) return "Schokolade";

  if (/spaghetti|pasta/.test(ns)) return "Spaghetti";
  if (/chips|pringles|stapelchips|crisps/.test(ns)) return "Chips";
  if (/haribo|goldb|gummi|fruchtgummi/.test(ns)) return "Fruchtgummi";
  if (/hafer|oat.*drink|oatmilk/.test(ns)) return "Haferdrink";

  return "Produkte";
}
  function buildPairRows(preise){
  return produktPaare.map((pair, idx) => {
    const v1 = preise[pair.p1.name];
    const v2 = preise[pair.p2.name];
    const hasAny = v1 != null || v2 != null;
    const missing = (v1 == null) !== (v2 == null); // genau einer fehlt
    const absDiff = (typeof v1 === "number" && typeof v2 === "number") ? Math.abs(v1 - v2) : -1;
    return { idx, pair, v1, v2, hasAny, missing, absDiff };
  }).filter(r => r.hasAny);
}
function selectCompactRow(rows){
  // 1) Zeilen mit fehlendem Wert
  const missing = rows.filter(r => r.missing);
  if (missing.length) return missing[0];
  // 2) größte Betragsabweichung
  const withDiff = rows.filter(r => r.absDiff >= 0);
  if (withDiff.length) return withDiff.sort((a,b)=> b.absDiff - a.absDiff)[0];
  // 3) sonst erste aus Stepper-Reihenfolge
  return rows[0];
}
function getRowLabels(pair){
  const v = (pair.vergleich || "").toLowerCase();
  if (v.includes("marke")) return { l1: "Eigen", l2: "Marke" }; // ⬅️ Eigen links
  if (v.includes("menge")) return { l1: "Klein", l2: "Groß" };
  if (v.includes("qualität") || v.includes("bio")) return { l1: "Konventionell", l2: "Bio" };
  return { l1: "A", l2: "B" };
}
// Vorschläge für alternative Größen/Varianten pro Produkt
function getSizeOptions(pair, p) {
  const base = (p.name || "").toLowerCase();
  const inPair = `${pair.kategorie || ""} ${pair.vergleich || ""}`.toLowerCase();

  // Cola
  if (/cola/.test(base) || /cola/.test(inPair)) {
    return ["0,33 l", "0,5 l", "1,0 l", "1,25 l", "1,5 l", "2,0 l"];
  }
  // Bananen
  if (/banan/.test(base) || /banan/.test(inPair)) {
    return ["500 g", "1 kg", "Bio 1 kg", "Fairtrade 1 kg"];
  }
  // Reis
  if (/reis|basmati/.test(base) || /reis|basmati/.test(inPair)) {
    return ["500 g", "1 kg", "2 kg"];
  }
  // Margarine / Butter-like
  if (/margarine|butter/.test(base) || /margarine|butter/.test(inPair)) {
    return ["250 g", "400 g", "500 g"];
  }
  // Schokolade
  if (/schoko|milka/.test(base) || /schoko|milka/.test(inPair)) {
    return ["90 g", "100 g", "200 g"];
  }
  // Spaghetti / Pasta
  if (/spaghetti|pasta/.test(base) || /spaghetti|pasta/.test(inPair)) {
    return ["500 g", "1 kg"];
  }
  // Chips
  if (/chips|pringles|stapelchips/.test(base) || /chips|pringles|stapelchips/.test(inPair)) {
    return ["165 g", "175 g", "200 g"];
  }
  // Fruchtgummi
  if (/haribo|gummi|fruchtgummi/.test(base) || /haribo|gummi|fruchtgummi/.test(inPair)) {
    return ["175 g", "200 g", "340 g"];
  }
  // Haferdrink
  if (/hafer|oat/.test(base) || /hafer|oat/.test(inPair)) {
    return ["0,75 l", "1,0 l", "1,5 l (Mehrpack)"];
  }

  // Fallback
  return ["Kleinere Menge", "Größere Menge"];
}
function getDisplayName(originalName) {
  const m = preisDaten[currentSupermarkt];
  return m?.groessen?.[originalName] || originalName;
}

function setSizeOverrideForCurrentMarket(originalName, newSizeLabel) {
  if (!currentSupermarkt) return;
  if (!preisDaten[currentSupermarkt]) {
    preisDaten[currentSupermarkt] = { preise: {}, bild: null, groessen: {} };
  }
  if (!preisDaten[currentSupermarkt].groessen) {
    preisDaten[currentSupermarkt].groessen = {};
  }
  // Schreibe nur die Anzeige-Variante („Produkt (neue Größe)“) für diesen Markt
  const base = originalName.replace(/\s*\([\s\S]*?\)\s*$/,"");
  preisDaten[currentSupermarkt].groessen[originalName] = `${base} (${newSizeLabel})`;
}
  
let currentMarker = null;            // Aktuell angeklickter Marker
let currentSupermarkt = "";          // Name des aktuellen Markts
let currentChain = "";               // Kette des aktuellen Markts, z. B. rewe, lidl, aldi
let zwischenBildFile = null; // Neu gewähltes, noch nicht hochgeladenes Bild
let zuletztHochgeladenesBildURL = null;

 
   // ──────────────────────────────
  // 6) Produktdefinition (Stepper)
  // ──────────────────────────────


  function formatVergleichLabel(pair) {
    if (pair.typ === "marke_vs_handelsmarke") return "Marke vs. Handelsmarke";
    if (pair.typ === "packungsgroesse") return "Packungsgrößenvergleich";
    return pair.vergleich || "Vergleich";
  }

  function getRoleLabel(pair, produkt) {
    if (pair.typ === "marke_vs_handelsmarke") {
      return produkt.rolle === "handelsmarke" ? "Handelsmarke" : "Markenprodukt";
    }

    if (pair.typ === "packungsgroesse") {
      return produkt.rolle === "klein" ? "Kleine Packung" : "Große Packung";
    }

    return produkt.rolle || "";
  }

  function getCategoryIcon(pair) {
    const id = (pair.id || pair.kategorie || "").toLowerCase();

    if (id.includes("milch")) return "🥛";
    if (id.includes("butter")) return "🧈";
    if (id.includes("spaghetti")) return "🍝";
    if (id.includes("cornflakes")) return "🥣";
    if (id.includes("hafer")) return "🌾";
    if (id.includes("cola")) return "🥤";
    if (id.includes("nutella")) return "🍫";
    if (id.includes("haribo") || id.includes("frucht")) return "🍬";
    if (id.includes("pringles") || id.includes("chips")) return "🥔";
    if (id.includes("kaffee")) return "☕";

    return "🛒";
  }

  function renderProductImage(pair, produkt, displayName) {
    const clean = (produkt.bildUrl || "").trim();

    if (clean && clean !== "...") {
      return `
        <img
          src="${clean}"
          alt="${displayName}"
          onerror="this.style.display='none'; this.parentElement.classList.add('has-icon-fallback'); this.parentElement.innerHTML='<div class=&quot;product-icon-fallback&quot;>${getCategoryIcon(pair)}</div>';"
        />
      `;
    }

    return `<div class="product-icon-fallback">${getCategoryIcon(pair)}</div>`;
  }

  // Produktpaare werden dynamisch je Supermarkt-Kette erzeugt.
  let produktPaare = [];

  // Step-Zustand
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
// ————————————————————
// 8) Step anzeigen
// ————————————————————
function renderStep() {
  const istProduktStep = currentStep < produktPaare.length;

  if (istProduktStep) {
    const pair = produktPaare[currentStep];

    stepContent.innerHTML = `
      <div class="step-header">
        <div class="step-type">${pair.typ || ""}</div>
        <div class="step-compare">Vergleich: ${pair.vergleich || ""}</div>
      </div>

      <div class="step-pane-content-grid">
        ${[pair.p1, pair.p2].map((p, idx) => {
          const inputId = `preisInput_${idx}`;
          const preset = (typeof p.preisErfasst === "number")
            ? p.preisErfasst
            : (p.preisErfasst ?? "");
          const displayName = getDisplayName(p.name);

          return `
            <div class="product-card">
              <div class="image-wrapper">
                <img
                  src="${safeImg(p.bildUrl, p.name)}"
                  alt="${displayName}"
                  onerror="this.onerror=null;this.src='${safeImg('', p.name)}';"
                />
              </div>
              <div class="step-pane-text">
                <h3>${displayName}</h3>
                <p>${p.beschreibung || ""}</p>
                <label>Preis (€):
                  <input id="${inputId}" type="number" step="0.01" inputmode="decimal" value="${preset}" />
                </label>

                <div class="size-row">
                  <button type="button" class="size-btn" data-side="${idx}">Größe ändern</button>
                  <div class="size-select hidden" id="sizeSelect_${idx}">
                    <select id="sizeOption_${idx}">
                      ${getSizeOptions(pair, p).map(opt => `<option value="${opt}">${opt}</option>`).join("")}
                    </select>
                    <button type="button" class="size-apply" data-side="${idx}">Übernehmen</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    // Größe ändern: Button → Select toggeln
    stepContent.querySelectorAll(".size-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const side = btn.getAttribute("data-side");
        const box  = document.getElementById(`sizeSelect_${side}`);
        if (box) box.classList.toggle("hidden");
      });
    });

    // Größe ändern: nur markt-spezifische Anzeige überschreiben (kein globales Rename)
    stepContent.querySelectorAll(".size-apply").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const side = parseInt(btn.getAttribute("data-side"), 10);
        const sel  = document.getElementById(`sizeOption_${side}`);
        if (!sel) return;

        const newLabel   = sel.value;                 // z. B. "1,25 l" oder "500 g"
        const original   = side === 0 ? pair.p1.name : pair.p2.name;

        setSizeOverrideForCurrentMarket(original, newLabel);
        renderStep(); // UI sofort aktualisieren
      });
    });

  } else {
    // Bild-Step in gleicher Optik wie die Produkt-Steps (2 Karten im Grid)
    stepContent.innerHTML = `
      <div class="step-header">
        <div class="step-type">Beleg</div>
        <div class="step-compare">Optionales Foto hochladen</div>
      </div>

      <div class="step-pane-content-grid">
        <div class="product-card">
          <div class="image-wrapper" id="belegBox"></div>
          <div class="step-pane-text">
            <h3>Belegfoto (optional)</h3>
            <input type="file" id="belegInput" accept="image/*" />
            <p id="belegHint" style="font-size:0.9em;color:#666;margin-top:6px;"></p>
          </div>
        </div>

        <div class="product-card">
          <div class="step-pane-text">
            <h3>Hinweis</h3>
            <p>Du kannst ein Foto vom Kassenbeleg hochladen. Das hilft, Preise zu verifizieren.</p>
            <ul style="margin:0.5em 0 0 1.25em; padding:0; font-size:0.95em; color:#555;">
              <li>Max. 1 Bild pro Markt-Eintrag</li>
              <li>Das Bild wird beim Speichern komprimiert</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    const box  = document.getElementById("belegBox");
    const hint = document.getElementById("belegHint");

    if (zwischenBildFile) {
      const url = URL.createObjectURL(zwischenBildFile);
      box.innerHTML = `<img src="${url}" alt="Belegvorschau" />`;
      hint.textContent = "(Wird beim Speichern hochgeladen)";
      const img = box.querySelector("img");
      img.onload = () => URL.revokeObjectURL(url);
    } else if (zuletztHochgeladenesBildURL) {
      box.innerHTML = `<img src="${zuletztHochgeladenesBildURL}?t=${Date.now()}" alt="Beleg" />`;
      hint.textContent = "";
    } else {
      box.innerHTML = ""; // leere weiße Box (durch .image-wrapper)
      hint.textContent = "(Kein Bild vorhanden)";
    }

    const belegInput = document.getElementById("belegInput");
    if (belegInput) {
      belegInput.addEventListener("change", evt => {
        zwischenBildFile = evt.target.files[0] || null;
        renderStep();
      });
    }
  }

  // Indikatoren: N Produkt-Steps + 1 Bild-Step
  indicators.innerHTML = "";
  const total = produktPaare.length + 1;
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
  const istProduktStep = currentStep < produktPaare.length;

  if (istProduktStep) {
    // beide Preise auslesen & zwischenspeichern
    const pair = produktPaare[currentStep];
    [pair.p1, pair.p2].forEach((p, idx) => {
      const el = document.getElementById(`preisInput_${idx}`);
      const raw = el ? ("" + el.value).replace(",", ".") : "";
      const val = parseFloat(raw);
      p.preisErfasst = Number.isFinite(val) ? val : null;
    });

    currentStep++;
    renderStep();
    return;
  }

  // Bild-Step: Upload (falls neu) + Firestore speichern
  let finaleBildUrl = zuletztHochgeladenesBildURL;

  if (zwischenBildFile) {
    nextBtn.disabled = true;
    nextBtn.textContent = "⏳ Bild wird hochgeladen...";

    const timestamp = Date.now();
    const safeName = currentSupermarkt.replace(/\W+/g, "_");
    const uniqueFileName = `${safeName}_${timestamp}.jpg`;

    try {
      const compressedBlob = await resizeImage(zwischenBildFile, 1024);
      const formData = new FormData();
      formData.append("file", compressedBlob, uniqueFileName);

      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const contentType = (res.headers.get("content-type") || "");
      if (!res.ok) throw new Error("Serverfehler beim Upload");
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error("Kein JSON erhalten: " + text);
      }

      const j = await res.json();
      finaleBildUrl = j.url;

      // Altes Bild (falls vorhanden) löschen
      const vorherigesBild = preisDaten[currentSupermarkt]?.bild;
      if (vorherigesBild) {
        const altDateiname = vorherigesBild.split("/").pop();
        await fetch("/api/delete-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: altDateiname })
        });
      }

      zuletztHochgeladenesBildURL = finaleBildUrl;
      preisDaten[currentSupermarkt] = preisDaten[currentSupermarkt] || { preise: {}, bild: null };
      preisDaten[currentSupermarkt].bild = finaleBildUrl;
      zwischenBildFile = null;
      nextBtn.textContent = "✅ Hochgeladen";
    } catch (error) {
      console.error("❌ Upload fehlgeschlagen:", error);
      nextBtn.textContent = "❌ Netzwerkfehler beim Hochladen";
      nextBtn.disabled = false;
      return;
    } finally {
      nextBtn.disabled = false;
    }
  }

  try {
    // Preise flach in ein Objekt überführen: { "Produktname": Preis|null, ... }
    const neuePreise = {};
    produktPaare.forEach(({ p1, p2 }) => {
      neuePreise[p1.name] = (typeof p1.preisErfasst === "number") ? p1.preisErfasst : (p1.preisErfasst ?? null);
      neuePreise[p2.name] = (typeof p2.preisErfasst === "number") ? p2.preisErfasst : (p2.preisErfasst ?? null);
    });
  const groessenOverrides = preisDaten[currentSupermarkt]?.groessen || {};
    await speicherePreisInFirestore(
      currentSupermarkt,
      neuePreise,
      finaleBildUrl,
      groessenOverrides   
    );

    zuletztHochgeladenesBildURL = finaleBildUrl;
    if (!preisDaten[currentSupermarkt]) preisDaten[currentSupermarkt] = { preise: {}, bild: null };
    preisDaten[currentSupermarkt].bild = finaleBildUrl;

    if (currentMarker) {
      popup
        .setLatLng(currentMarker.getLatLng())
        .setContent(setPopupContent(currentSupermarkt))
        .openOn(map);
      setPopupEventListeners();
    }

    stepperModal.classList.add("hidden");
    nextBtn.textContent = "Weiter";
  } catch (err) {
    console.error("❌ Fehler beim Speichern:", err);
    nextBtn.textContent = "Weiter";
  }
};

  // ──────────────────────────────
  // 10) Daten aus Firestore laden
  // ──────────────────────────────
async function ladePreiseAusFirestore() {
  const snapshot = await getDocs(collection(db, "preise"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.markt) {
      preisDaten[data.markt] = {
        preise: data.preise || {},
        bild: data.bild || null,
        groessen: data.groessen || {}   // ⬅️ NEU
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
  currentChain      = markt.chain || "";
  currentMarker     = marker;

  produktPaare = getProduktVergleicheFuerMarkt(currentChain);

          // Werte vorbefüllen
              const daten = preisDaten[markt.name] || {};
              zuletztHochgeladenesBildURL = daten.bild || null;
              zwischenBildFile = null; // Reset für Stepper
              
              // Preise aus Firestore in die Paare mappen
              produktPaare.forEach(pair => {
                const preis1 = daten.preise?.[pair.p1.name];
                const preis2 = daten.preise?.[pair.p2.name];
                pair.p1.preisErfasst = (typeof preis1 === "number") ? preis1 : (preis1 ?? null);
                pair.p2.preisErfasst = (typeof preis2 === "number") ? preis2 : (preis2 ?? null);
              });
            // Popup anzeigen
            popup
              .setLatLng(markt.coords)
              .setContent(setPopupContent(markt.name))
              .openOn(map);

            setPopupEventListeners();
            // Klicks im Popup nicht an die Karte „durchreichen“
setTimeout(() => {
  const el = popup.getElement();
  if (el) L.DomEvent.disableClickPropagation(el);
}, 0);

          });
        });
      });
  }

  // ──────────────────────────────
  // 12) Popup-HTML generieren
  // ──────────────────────────────
function setPopupContent(name) {
  const d = preisDaten[name] || {};
  const preise = d.preise || {};

  // Zustand initialisieren (kompakt + kein Bild)
  if (!popupState[name]) popupState[name] = { expanded: false, showImage: false };
  const { expanded, showImage } = popupState[name];

  const rows = buildPairRows(preise);
  const total = rows.length;

  // Sichtbare Zeilen: 1 kompakt ODER alle
  let visibleRows = [];
  if (!expanded) {
    const one = selectCompactRow(rows);
    if (one) visibleRows = [one];
  } else {
    visibleRows = rows;
  }

  const fmt = (v) => (typeof v === "number" ? v.toFixed(2).replace(".", ",") + " €" : "–");
  const delta = (a, b) => {
    if (typeof a !== "number" || typeof b !== "number") return "";
    const diff = a - b;
    if (!isFinite(diff)) return "";
    if (diff === 0) return "±0%";
    const pct = Math.round(Math.abs(diff / b * 100));
    return (diff < 0 ? "−" : "+") + pct + "%";
  };

  let html = `<div class="pp-head"><strong>${name}</strong></div>`;

  // Preis-Zeilen
  if (visibleRows.length > 0) {
    html += `<div class="pp-list ${expanded ? "pp-list--expanded" : ""}">`;
    html += visibleRows.map(({ pair, v1, v2 }) => {
      const cat = getPairCategory(pair);
      const { l1, l2 } = getRowLabels(pair);
      const cheaper = (typeof v1 === "number" && typeof v2 === "number")
        ? (v1 < v2 ? "left" : (v2 < v1 ? "right" : "equal"))
        : "unknown";
      return `
        <div class="pp-row">
          <div class="pp-cat">${cat}</div>
          <div class="pp-values">
            <span class="pp-pill ${cheaper==="left"?"pp-cheap":""}" title="${getDisplayName(pair.p1.name)}">${l1}: ${fmt(v1)}</span>
            <span class="pp-delta">${delta(v1, v2)}</span>
            <span class="pp-pill ${cheaper==="right"?"pp-cheap":""}"title="${getDisplayName(pair.p2.name)}">${l2}: ${fmt(v2)}</span>
          </div>
        </div>
      `;
    }).join("");
    html += `</div>`;

    if (total > 1) {
      html += `<button id="popupToggleBtn" class="secondary pp-btn">${expanded ? "Weniger anzeigen" : `Alle anzeigen (${total})`}</button>`;
    }
  } else {
    html += `<p class="pp-empty">Noch keine Preise eingetragen.</p>`;
  }

  // Bild-Button NACH den Preisen
  if (d.bild) {
    html += `<button id="popupImgBtn" class="btn-ghost pp-btn">${showImage ? "Bild verbergen" : "🖼️ Bild ansehen"}</button>`;
    if (showImage) {
      html += `<img src="${d.bild}?t=${Date.now()}" class="pp-img" alt="Bild">`;
      html += `<button id="bildLoeschenBtn" class="secondary pp-btn">🗑️ Bild löschen</button>`;
    }
  }

  // Immer sichtbar
  html += `<button id="bearbeitenBtn" class="pp-btn">Preise bearbeiten</button>`;
  return html;
}

// ──────────────────────────────
// 13) Popup-Event-Logik
// ──────────────────────────────
function setPopupEventListeners() {
  // Preise bearbeiten
  const bearbeitenBtn = document.getElementById("bearbeitenBtn");
  if (bearbeitenBtn) {
    bearbeitenBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openStepper(); };
  }

  // Bild ansehen / verbergen
  const imgBtn = document.getElementById("popupImgBtn");
  if (imgBtn) {
    imgBtn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const state = popupState[currentSupermarkt] || { expanded:false, showImage:false };
      state.showImage = !state.showImage;
      popupState[currentSupermarkt] = state;
      popup.setContent(setPopupContent(currentSupermarkt)).update();
      setPopupEventListeners();
    };
  }

  // Bild löschen
  const loeschenBtn = document.getElementById("bildLoeschenBtn");
  if (loeschenBtn) {
    loeschenBtn.onclick = async (e) => {
      e.preventDefault(); e.stopPropagation();
      loeschenBtn.disabled = true;
      loeschenBtn.textContent = "⏳ Löschen...";

      const bildName = (preisDaten[currentSupermarkt].bild || "").split("/").pop();
      if (bildName) {
        await fetch("/api/delete-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: bildName })
        });
      }
      preisDaten[currentSupermarkt].bild = null;
      await speicherePreisInFirestore(currentSupermarkt, preisDaten[currentSupermarkt].preise, null);

      // State zurücksetzen & UI refreshen
      popupState[currentSupermarkt].showImage = false;
      popup.setContent(setPopupContent(currentSupermarkt)).update();
      setPopupEventListeners();
    };
  }

  // Alle anzeigen / Weniger anzeigen
  const toggleBtn = document.getElementById("popupToggleBtn");
  if (toggleBtn) {
    toggleBtn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const state = popupState[currentSupermarkt] || { expanded:false, showImage:false };
      state.expanded = !state.expanded;
      popupState[currentSupermarkt] = state;
      popup.setContent(setPopupContent(currentSupermarkt)).update();
      setPopupEventListeners();
    };
  }
}
  // ──────────────────────────────
  // 14) Firestore speichern
  // ──────────────────────────────
 async function speicherePreisInFirestore(markt, preise, bildURL = null, groessen = null) {
  const exist = preisDaten[markt] || {};
  const payload = {
    markt,
    preise: preise || exist.preise || {},
    bild: (bildURL !== null ? bildURL : (exist.bild || null)),
    groessen: groessen || exist.groessen || {},   // ⬅️ NEU
    zeitstempel: serverTimestamp()
  };

  await setDoc(doc(db, "preise", markt.replace(/\W+/g, "_")), payload);
  preisDaten[markt] = payload;

  if (currentMarker) currentMarker.setIcon(greyIcon);
}
 // ──────────────────────────────
// 15) Datei komprimieren (JPEG)
// ──────────────────────────────
async function resizeImage(file, maxSize = 1024) {
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
