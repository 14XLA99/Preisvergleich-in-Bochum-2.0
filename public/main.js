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
// 4) Marker-Icons (Blau / Grau / Grün)
// ──────────────────────────────
const normalIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41]
});

const greyIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41]
});

const greenIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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
  function getMarkerStatusForMarkt(marktName, chain = "") {
  const daten = preisDaten[marktName];

  // Noch gar keine Daten vorhanden
  if (!daten || !daten.preise) {
    return "empty";
  }

  // Produktpaare für diese Kette holen
  const paare = getProduktVergleicheFuerMarkt(chain);

  let filledCount = 0;
  const totalCount = paare.length * 2; // pro Vergleich 2 Preise

  paare.forEach((pair) => {
    const v1 = daten.preise[pair.p1.name];
    const v2 = daten.preise[pair.p2.name];

    if (typeof v1 === "number" && !Number.isNaN(v1)) filledCount++;
    if (typeof v2 === "number" && !Number.isNaN(v2)) filledCount++;
  });

  if (filledCount === 0) return "empty";
  if (filledCount >= totalCount) return "complete";
  return "partial";
}

function getMarkerIconForMarkt(marktName, chain = "") {
  const status = getMarkerStatusForMarkt(marktName, chain);

  if (status === "complete") return greenIcon;
  if (status === "partial") return greyIcon;
  return normalIcon;
}
function buildPairRows(preise, angebote = {}){
  return produktPaare.map((pair, idx) => {
    const v1 = preise[pair.p1.name];
    const v2 = preise[pair.p2.name];
    const a1 = angebote[pair.p1.name] === true;
    const a2 = angebote[pair.p2.name] === true;

    const hasAny = v1 != null || v2 != null;
    const missing = (v1 == null) !== (v2 == null);
    const absDiff = (typeof v1 === "number" && typeof v2 === "number")
      ? Math.abs(v1 - v2)
      : -1;

    return { idx, pair, v1, v2, a1, a2, hasAny, missing, absDiff };
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
  if (pair.typ === "marke_vs_handelsmarke") {
    return { l1: "Eigen", l2: "Marke" };
  }

  if (pair.typ === "packungsgroesse") {
    return { l1: "Klein", l2: "Groß" };
  }

  if (pair.typ === "fettgehalt") {
    return { l1: "1,5 %", l2: "3,5 %" };
  }

  return { l1: "A", l2: "B" };
}
// Vorschläge für alternative Größen/Varianten pro Produkt
function getSizeOptions(pair, p) {
  const id = (pair.id || "").toLowerCase();
  const kat = (pair.kategorie || "").toLowerCase();
  const name = (p.name || "").toLowerCase();
  const text = `${id} ${kat} ${name}`;

  // Volvic / Wasser
  if (/volvic|wasser/.test(text)) {
    return ["0,5 l", "0,75 l", "1,0 l", "1,5 l", "2,0 l"];
  }

  // Coca-Cola
  if (/cola|coke/.test(text)) {
    return ["0,33 l", "0,5 l", "1,0 l", "1,25 l", "1,5 l", "2,0 l"];
  }

  // Nutella / Nuss-Nougat-Creme
  if (/nutella|nougat|nuss/.test(text)) {
    return ["400 g", "450 g", "500 g", "750 g", "825 g", "1 kg"];
  }

  // Haribo / Fruchtgummi
  if (/haribo|fruchtgummi|gummi/.test(text)) {
    return ["160 g", "175 g", "200 g", "300 g", "340 g", "360 g"];
  }

  // H-Milch / Fettgehalt
  if (/milch|h-milch/.test(text)) {
    return ["1 l", "0,5 l", "1,5 l"];
  }

  // Spaghetti
  if (/spaghetti|pasta/.test(text)) {
    return ["500 g", "1 kg"];
  }

  // Haferdrink
  if (/hafer|oat/.test(text)) {
    return ["1 l", "0,75 l", "1,5 l"];
  }

  // Stapelchips / Pringles
  if (/chips|pringles|stapelchips/.test(text)) {
    return ["165 g", "175 g", "185 g", "200 g"];
  }

  // Kaffee
  if (/kaffee|jacobs/.test(text)) {
    return ["500 g", "250 g", "1 kg"];
  }

  // Salz
  if (/salz|jodsalz/.test(text)) {
    return ["500 g", "1 kg"];
  }

  return ["Kleinere Menge", "Größere Menge"];
}
function getDisplayName(originalName) {
  const m = preisDaten[currentSupermarkt];
  return m?.groessen?.[originalName] || originalName;
}

function setSizeOverrideForCurrentMarket(originalName, newSizeLabel) {
  if (!currentSupermarkt) return;
  if (!preisDaten[currentSupermarkt]) {
    preisDaten[currentSupermarkt] = { preise: {}, angebote: {}, bild: null, groessen: {} };
  }
  if (!preisDaten[currentSupermarkt].groessen) {
    preisDaten[currentSupermarkt].groessen = {};
  }

  const base = originalName.replace(/\s*\([\s\S]*?\)\s*$/,"");
  const cleanLabel = (newSizeLabel || "").trim();

  if (!cleanLabel) return;

  preisDaten[currentSupermarkt].groessen[originalName] = `${base} (${cleanLabel})`;
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
  if (pair.typ === "fettgehalt") return "Fettgehaltsvergleich";
  return pair.vergleich || "Vergleich";
}

function getRoleLabel(pair, produkt) {
  if (pair.typ === "marke_vs_handelsmarke") {
    return produkt.rolle === "handelsmarke" ? "Handelsmarke" : "Markenprodukt";
  }

  if (pair.typ === "packungsgroesse") {
    return produkt.rolle === "klein" ? "Kleine Packung" : "Große Packung";
  }

  if (pair.typ === "fettgehalt") {
    if (produkt.rolle === "fettarm") return "1,5 % Fett";
    if (produkt.rolle === "vollmilch") return "3,5 % Fett";
  }

  return produkt.rolle || "";
}

 function getCategoryIcon(pair) {
  const id = (pair.id || pair.kategorie || "").toLowerCase();

  if (id.includes("milch")) return "🥛";
  if (id.includes("wasser") || id.includes("volvic")) return "💧";
  if (id.includes("spaghetti")) return "🍝";
  if (id.includes("hafer")) return "🌾";
  if (id.includes("cola")) return "🥤";
  if (id.includes("nutella") || id.includes("nougat")) return "🍫";
  if (id.includes("haribo") || id.includes("frucht")) return "🍬";
  if (id.includes("stapelchips") || id.includes("pringles") || id.includes("chips")) return "🥔";
  if (id.includes("kaffee")) return "☕";
  if (id.includes("salz") || id.includes("jodsalz")) return "🧂";

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
function renderStep() {
  const istProduktStep = currentStep < produktPaare.length;

  if (istProduktStep) {
    const pair = produktPaare[currentStep];
    const categoryImage = (pair.bildUrl || "").trim();

    stepContent.innerHTML = `
      <div class="step-header">
        <div>
          <div class="step-category">
            ${getCategoryIcon(pair)} ${pair.kategorie || "Produkt"}
          </div>
          <div class="step-subtitle">${formatVergleichLabel(pair)}</div>
        </div>
        <div class="step-compare">Schritt ${currentStep + 1} von ${produktPaare.length}</div>
      </div>

      <div class="category-image-wrapper">
        ${
          categoryImage
            ? `<img src="${categoryImage}" alt="${pair.kategorie || "Produkt"}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=&quot;product-icon-fallback&quot;>${getCategoryIcon(pair)}</div>';" />`
            : `<div class="product-icon-fallback">${getCategoryIcon(pair)}</div>`
        }
      </div>

      <div class="step-pane-content-grid">
        ${[pair.p1, pair.p2].map((p, idx) => {
          const inputId = `preisInput_${idx}`;
          const preset = (typeof p.preisErfasst === "number")
            ? p.preisErfasst
            : (p.preisErfasst ?? "");
          const displayName = getDisplayName(p.name);
          const roleLabel = getRoleLabel(pair, p);

          return `
            <div class="product-card product-card--compact">
              <div class="product-role-badge ${p.rolle}">
                ${roleLabel}
              </div>

              <div class="step-pane-text">
                <h3>${displayName}</h3>
                <p>${p.beschreibung || ""}</p>

         <label>Preis (€):
  <input id="${inputId}" type="number" step="0.01" inputmode="decimal" value="${preset}" />
</label>

<label class="angebot-check">
  <input id="angebotInput_${idx}" type="checkbox" ${p.angebot === true ? "checked" : ""} />
  Angebotspreis
</label>

               <div class="size-row">
  <button type="button" class="size-btn" data-side="${idx}">Größe ändern</button>

  <div class="size-select hidden" id="sizeSelect_${idx}">
    <p class="size-hint">
      Wenn eine der abgefragten Produktgrößen nicht verfügbar ist, ändern Sie bitte die Größenangabe.
      Tun Sie das aber bitte nur dann, wenn die vorgegebene Größe tatsächlich nicht verfügbar ist.
    </p>

    <input
      id="sizeOption_${idx}"
      class="size-input"
      type="text"
      placeholder="z. B. 1,25 l oder 500 g"
    />

    <button type="button" class="size-apply" data-side="${idx}">Übernehmen</button>
  </div>
</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    stepContent.querySelectorAll(".size-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const side = btn.getAttribute("data-side");
        const box  = document.getElementById(`sizeSelect_${side}`);
        if (box) box.classList.toggle("hidden");
      });
    });

    stepContent.querySelectorAll(".size-apply").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const side = parseInt(btn.getAttribute("data-side"), 10);
        const sel  = document.getElementById(`sizeOption_${side}`);
        if (!sel) return;

        const newLabel = sel.value.trim();
        if (!newLabel) return;
        const original = side === 0 ? pair.p1.name : pair.p2.name;

        setSizeOverrideForCurrentMarket(original, newLabel);
        renderStep();
      });
    });

  } else {
    stepContent.innerHTML = `
      <div class="step-header">
        <div>
          <div class="step-category">Belegfoto</div>
          <div class="step-subtitle">Optionaler Nachweis</div>
        </div>
        <div class="step-compare">Letzter Schritt</div>
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
      box.innerHTML = `<div class="product-icon-fallback">📷</div>`;
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

 indicators.innerHTML = "";
const total = produktPaare.length + 1;

for (let i = 0; i < total; i++) {
  const dot = document.createElement("div");
  const isFinalStep = i === produktPaare.length;

  dot.className =
    (isFinalStep ? "step-dot step-dot-final" : "step-dot") +
    (i === currentStep ? " active" : "");

  dot.title = isFinalStep ? "Übernehmen" : `Schritt ${i + 1}`;
  dot.onclick = () => goToStep(i);

  indicators.appendChild(dot);
}

nextBtn.textContent =
  currentStep === produktPaare.length ? "Übernehmen" : "Weiter";
}

// ──────────────────────────────
// 9) Stepper öffnen / schließen / steuern (vollständig, mit Komprimierung und FormData)
// ──────────────────────────────
function saveCurrentProductStepInputs() {
  const istProduktStep = currentStep < produktPaare.length;
  if (!istProduktStep) return;

  const pair = produktPaare[currentStep];

  [pair.p1, pair.p2].forEach((p, idx) => {
    const preisEl = document.getElementById(`preisInput_${idx}`);
    const angebotEl = document.getElementById(`angebotInput_${idx}`);

    const raw = preisEl ? ("" + preisEl.value).replace(",", ".") : "";
    const val = parseFloat(raw);

    p.preisErfasst = Number.isFinite(val) ? val : null;
    p.angebot = angebotEl ? angebotEl.checked === true : false;
  });
}

function goToStep(targetStep) {
  saveCurrentProductStepInputs();
  currentStep = targetStep;
  renderStep();
}
  function openStepper() {
  currentStep = 0;
  renderStep();
  stepperModal.classList.remove("hidden");
}

closeStepper.onclick = () => stepperModal.classList.add("hidden");

prevBtn.onclick = () => {
  if (currentStep > 0) {
    goToStep(currentStep - 1);
  }
};

nextBtn.onclick = async () => {
  const istProduktStep = currentStep < produktPaare.length;

 if (istProduktStep) {
  goToStep(currentStep + 1);
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
const neueAngebote = {};

produktPaare.forEach(({ p1, p2 }) => {
  neuePreise[p1.name] = (typeof p1.preisErfasst === "number") ? p1.preisErfasst : (p1.preisErfasst ?? null);
  neuePreise[p2.name] = (typeof p2.preisErfasst === "number") ? p2.preisErfasst : (p2.preisErfasst ?? null);

  neueAngebote[p1.name] = p1.angebot === true;
  neueAngebote[p2.name] = p2.angebot === true;
});

const groessenOverrides = preisDaten[currentSupermarkt]?.groessen || {};

await speicherePreisInFirestore(
  currentSupermarkt,
  neuePreise,
  finaleBildUrl,
  groessenOverrides,
  neueAngebote
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
  angebote: data.angebote || {},
  bild: data.bild || null,
  groessen: data.groessen || {}
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
  const icon = getMarkerIconForMarkt(markt.name, markt.chain || "");
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
                pair.p1.angebot = daten.angebote?.[pair.p1.name] === true;
                pair.p2.angebot = daten.angebote?.[pair.p2.name] === true;
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
  const angebote = d.angebote || {};

  // Zustand initialisieren (kompakt + kein Bild)
  if (!popupState[name]) popupState[name] = { expanded: false, showImage: false };
  const { expanded, showImage } = popupState[name];

  const rows = buildPairRows(preise, angebote);
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
    html += visibleRows.map(({ pair, v1, v2, a1, a2 }) => {
      const cat = getPairCategory(pair);
      const { l1, l2 } = getRowLabels(pair);
      const cheaper = (typeof v1 === "number" && typeof v2 === "number")
        ? (v1 < v2 ? "left" : (v2 < v1 ? "right" : "equal"))
        : "unknown";
      return `
        <div class="pp-row">
          <div class="pp-cat">${cat}</div>
          <div class="pp-values">
           <span class="pp-pill ${cheaper==="left"?"pp-cheap":""}" title="${getDisplayName(pair.p1.name)}">
  ${l1}: ${fmt(v1)}${a1 ? " 🔖" : ""}
</span>
<span class="pp-delta">${delta(v1, v2)}</span>
<span class="pp-pill ${cheaper==="right"?"pp-cheap":""}" title="${getDisplayName(pair.p2.name)}">
  ${l2}: ${fmt(v2)}${a2 ? " 🔖" : ""}
</span>
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
async function speicherePreisInFirestore(markt, preise, bildURL = null, groessen = null, angebote = null) {
  const exist = preisDaten[markt] || {};
  const payload = {
    markt,
    preise: preise || exist.preise || {},
    angebote: angebote || exist.angebote || {},
    bild: (bildURL !== null ? bildURL : (exist.bild || null)),
    groessen: groessen || exist.groessen || {},   // ⬅️ NEU
    zeitstempel: serverTimestamp()
  };

 await setDoc(doc(db, "preise", markt.replace(/\W+/g, "_")), payload);
preisDaten[markt] = payload;

if (currentMarker) {
  currentMarker.setIcon(getMarkerIconForMarkt(markt, currentChain));
}
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
