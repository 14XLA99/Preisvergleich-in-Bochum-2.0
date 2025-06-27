// 🔥 Firebase- und 🍃 Leaflet-Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // ─────────── 1) Firebase initialisieren ───────────
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

  // ─────────── 2) Leaflet‑Map initialisieren ───────────
  const map = L.map("map", {
    maxBounds: L.latLngBounds([51.35,7.05],[51.56,7.35]),
    maxBoundsViscosity: 1.0
  }).setView([51.4718,7.2162],12);
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    { attribution:'&copy; CARTO &copy; OSM', subdomains:"abcd", maxZoom:19 }
  ).addTo(map);

  // ─────────── 3) Bezirks-Overlay ───────────
  const bezirksFarben = ["#cce5ff","#d4f4dd","#fff3bf","#ffdede","#f5e0ff","#e3f2fd"];
  fetch("/bochum_bezirke.geojson")
    .then(r=>r.json())
    .then(data=> {
      let idx = 0;
      L.geoJSON(data, {
        style: () => ({
          color: "#888",
          weight: 1,
          fillColor: bezirksFarben[(idx++) % bezirksFarben.length],
          fillOpacity: 0.4
        }),
        onEachFeature: (f, layer) => {
          const name = f.properties.Bezeichnun||"Unbenannt";
          layer.bindPopup(`<strong>${name}</strong>`);
          const ctr = layer.getBounds().getCenter();
          L.marker(ctr, {
            icon: L.divIcon({
              className: "bezirk-label",
              html: `<div>${name}</div>`,
              iconSize: [100,20],
              iconAnchor: [50,10]
            }),
            interactive: false
          }).addTo(map);
        }
      }).addTo(map);
    });

  // ─────────── 4) Marker-Icons ───────────
  const normalIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41,41]
  });
  const greyIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41,41]
  });
  const popup = L.popup();

  // ─────────── 5) State / In‑Memory Cache ───────────
  let preisDaten = {};               // { markt: { preise: {...}, bild: url } }
  let currentMarker = null;
  let currentSupermarkt = "";
  let zuletztHochgeladenesBildURL = null; // wird beim Marker-Click vorbefüllt

  // ─────────── 6) Produkte + Stepper Setup ───────────
  const produkte = [
    { name:"Brot", beschreibung:"Frisches Brot", bildUrl:"https://www.kingarthurbaking.com/sites/default/files/styles/featured_image/public/2020-05/french-style-country-loaf.jpg" },
    { name:"Milch", beschreibung:"1 l Vollmilch", bildUrl:"https://https://issing.digitale-theke.com/wp-content/uploads/2021/05/Vollmilch-35-gut-und-guenstig-Issing-P1330739.png" },
    { name:"Äpfel", beschreibung:"1 kg Äpfel", bildUrl:"https://www.spargelbuffet.de/wp-content/uploads/2021/01/aepfel1.jpg" },
    { name:"Butter", beschreibung:"250 g Butter", bildUrl:"https://www.hoche-butter.de/fileadmin/_processed_/c/4/csm_120086-Hoche-Uelzena-Paketbutter-Deutsche-Markenbutter-Buttergenuss-250g-800800_1854122865.png.pagespeed.ce.-BVqKQ7Smg.png;" },
    { name:"Nudeln", beschreibung:"500 g Nudeln", bildUrl:"https://www.kelemidis.de/media/cache/73/9c/739ca90930ace806f2f6210ad9d92610.jpg" }
  ];
  let currentStep = 0;

  // DOM-Referenzen für den Stepper
  const stepperModal = document.getElementById("stepperModal");
  const stepContent   = document.getElementById("step-content");
  const prevBtn       = document.getElementById("prevStep");
  const nextBtn       = document.getElementById("nextStep");
  const indicators    = document.getElementById("stepIndicators");
  const closeStepper  = document.getElementById("stepperCloseBtn");

  // ─────────── 7) Stepper rendern ───────────
  function renderStep() {
    if (currentStep < produkte.length) {
      // Produkt-Schritt
      const p = produkte[currentStep];
      stepContent.innerHTML = `
       <div class="image-wrapper">
  <img src="${p.bildUrl}" alt="${p.name}">
</div>
        <h3>${p.name}</h3>
        <p>${p.beschreibung}</p>
        <label>Preis (€):
          <input id="preisInput" type="number" step="0.01"
                 value="${p.preisErfasst ?? ''}" />
        </label>
      `;
    } else {
      // Letzter Schritt: Belegfoto (optional)
      stepContent.innerHTML = `
        <h3>Belegfoto (optional)</h3>
        <input type="file" id="belegInput" accept="image/*" />
        <div id="belegPreview" style="margin-top:1em;"></div>
      `;
      // Falls schon ein Bild da ist, direkt anzeigen
      if (zuletztHochgeladenesBildURL) {
        document.getElementById("belegPreview").innerHTML = `
          <img src="${zuletztHochgeladenesBildURL}"
               style="max-width:100%;max-height:150px;border-radius:4px;">
        `;
      }
      document.getElementById("belegInput")
        .addEventListener("change", evt => {
          const f = evt.target.files[0];
          if (f) {
            const url = URL.createObjectURL(f);
            zuletztHochgeladenesBildURL = null; // zurücksetzen, falls neu gewählt
            document.getElementById("belegPreview")
              .innerHTML = `<img src="${url}"
                style="max-width:100%;max-height:150px;border-radius:4px;">`;
          }
        });
    }

    // Schritt-Indikatoren neu zeichnen
    indicators.innerHTML = "";
    const total = produkte.length + 1;
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("div");
      dot.className = "step-dot" + (i === currentStep ? " active" : "");
      dot.onclick = () => { currentStep = i; renderStep(); };
      indicators.appendChild(dot);
    }
  }

  // ─────────── 8) Stepper öffnen / Navigation ───────────
  function openStepper() {
    currentStep = 0;
    renderStep();
    stepperModal.classList.remove("hidden");
  }
  closeStepper.onclick = () => stepperModal.classList.add("hidden");
  prevBtn.onclick      = () => { if (currentStep > 0) { currentStep--; renderStep(); } };

  nextBtn.onclick = async () => {
    if (currentStep < produkte.length) {
      // Preis erfassen
      produkte[currentStep].preisErfasst =
        parseFloat(document.getElementById("preisInput").value) || null;
      currentStep++;
      renderStep();
    } else {
      // Belegfoto hochladen (falls neu gewählt)
      const inp = document.getElementById("belegInput");
      if (inp.files[0]) {
        const b64 = await fileToBase64(inp.files[0]);
        const res = await fetch("/api/upload-image", {
          method: "POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            imageBase64: b64,
            fileName: `${currentSupermarkt.replace(/\W+/g,"_")}.jpg`
          })
        });
        const j = await res.json();
        if (res.ok) zuletztHochgeladenesBildURL = j.url;
      }
      // Alle Preise + Bild speichern
      const neuePreise = {};
      produkte.forEach(p => neuePreise[p.name] = p.preisErfasst ?? null);
      await speicherePreisInFirestore(currentSupermarkt, neuePreise, zuletztHochgeladenesBildURL);

      // Popup aktualisieren und schließen
      popup
        .setContent(setPopupContent(currentSupermarkt))
        .openOn(map);
      setPopupEventListeners();
      stepperModal.classList.add("hidden");
    }
  };

  // ─────────── 9) Daten aus Firestore laden ───────────
  async function ladePreiseAusFirestore() {
    const snap = await getDocs(collection(db,"preise"));
    snap.forEach(d => {
      const data = d.data();
      if (data.markt && data.preise) {
        preisDaten[data.markt] = {
          preise: data.preise,
          bild:   data.bild || null
        };
      }
    });
    ladeSupermarktMarker();
  }

  // ─────────── 10) Supermarkt-Marker setzen ───────────
  function ladeSupermarktMarker() {
    fetch("/supermaerkte.json")
      .then(r=>r.json())
      .then(arr=> {
        arr.forEach(m => {
          const has = preisDaten[m.name];
          const mk  = L.marker(m.coords, { icon: has ? greyIcon : normalIcon })
            .addTo(map);
          mk.on("click", () => {
            currentSupermarkt = m.name;
            currentMarker     = mk;
            // hier wichtig: beim Öffnen vorbefüllen!
            zuletztHochgeladenesBildURL = preisDaten[m.name]?.bild || null;
            produkte.forEach(p => {
              p.preisErfasst = preisDaten[m.name]?.preise?.[p.name] ?? null;
            });
            popup
              .setLatLng(m.coords)
              .setContent(setPopupContent(m.name))
              .openOn(map);
            setPopupEventListeners();
          });
        });
      });
  }

  // ─────────── 11) Popup-Inhalt generieren ───────────
  function setPopupContent(name) {
    const d = preisDaten[name] || {};
    let html = `<div style="margin-bottom:0.3em;"><strong style="font-size:1.1em;">${name}</strong></div>`;

    if (d.preise) {
      html += `<div style="font-size:0.9em;margin-bottom:0.5em;">` +
        Object.entries(d.preise).map(([p,v]) =>
          `<div><b>${p}:</b> ${v!=null?v.toFixed(2)+" €":"–"}</div>`
        ).join("") +
        `</div>`;
    } else {
      html += `<p>Keine Preise</p>`;
    }

    if (d.bild) {
      html += `
        <img src="${d.bild}"
             style="max-width:100%;max-height:150px;display:block;margin:0.5em 0;border-radius:4px;object-fit:contain;">
        <button id="bildLoeschenBtn" style="margin-bottom:0.5em;">🗑️ Bild löschen</button>
      `;
    }

    html += `<button id="bearbeitenBtn">Preise bearbeiten</button>`;
    return html;
  }

  // ─────────── 12) Popup-Event-Handler (Bearbeiten + Löschen) ───────────
  function setPopupEventListeners() {
    // ✏️ Bearbeiten → Stepper öffnen
    const bp = document.getElementById("bearbeitenBtn");
    if (bp) bp.onclick = openStepper;

    // 🗑️ Belegfoto löschen
    const del = document.getElementById("bildLoeschenBtn");
    if (del) del.onclick = async () => {
      const fn = (preisDaten[currentSupermarkt].bild||"").split("/").pop();
      if (!fn) return;
      await fetch("/api/delete-image", {
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ fileName: fn })
      });
      preisDaten[currentSupermarkt].bild = null;
      await speicherePreisInFirestore(
        currentSupermarkt,
        preisDaten[currentSupermarkt].preise,
        null
      );
      popup.setContent(setPopupContent(currentSupermarkt)).openOn(map);
      setPopupEventListeners();
    };
  }

  // ─────────── 13) Speichern in Firestore ───────────
  async function speicherePreisInFirestore(markt, eintraege, bildURL=null) {
    await setDoc(
      doc(db,"preise",markt.replace(/\W+/g,"_")),
      { markt, preise: eintraege, bild: bildURL||null, zeitstempel: serverTimestamp() }
    );
    preisDaten[markt] = { preise: eintraege, bild: bildURL||null };
    if (currentMarker) currentMarker.setIcon(greyIcon);
  }

  // ─────────── 14) Helper: File → Base64 ───────────
  function fileToBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result.split(",")[1]);
      r.onerror   = rej;
      r.readAsDataURL(file);
    });
  }

  // ─────────── 15) Karte neu zeichnen bei Visibility-Change ───────────
  window.addEventListener("pageshow",      () => map.invalidateSize());
  document.addEventListener("visibilitychange",
    () => !document.hidden && map.invalidateSize()
  );

  // ─────────── 16) App starten ───────────
  ladePreiseAusFirestore();
});
