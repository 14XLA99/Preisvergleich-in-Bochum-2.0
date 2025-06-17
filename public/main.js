
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
  // ─────────── Firebase initialisieren ───────────
  const firebaseConfig = {
    apiKey: "...",
    authDomain: "preisvergleich-bochum.firebaseapp.com",
    projectId: "preisvergleich-bochum",
    storageBucket: "preisvergleich-bochum.appspot.com",
    messagingSenderId: "...",
    appId: "..."
  };
  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);
  const auth = getAuth(app);
  signInAnonymously(auth).catch(console.error);

  // ─────────── Leaflet‑Map initialisieren ───────────
  const map = L.map("map", {
    maxBounds: L.latLngBounds([51.35, 7.05], [51.56, 7.35]),
    maxBoundsViscosity: 1.0
  }).setView([51.4718, 7.2162], 12);
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    { attribution:'&copy; CARTO &copy; OSM', subdomains:"abcd", maxZoom:19 }
  ).addTo(map);

  // ─────────── Styles für Bezirke ───────────
  const bezirksFarben = ["#cce5ff","#d4f4dd","#fff3bf","#ffdede","#f5e0ff","#e3f2fd"];
  fetch("/bochum_bezirke.geojson")
    .then(r=>r.json())
    .then(data=>{
      let idx=0;
      L.geoJSON(data, {
        style:()=>({
          color:"#888", weight:1,
          fillColor: bezirksFarben[(idx++)%bezirksFarben.length],
          fillOpacity:0.4
        }),
        onEachFeature:(f,layer)=>{
          const name = f.properties.Bezeichnun||"Unbenannt";
          layer.bindPopup(`<strong>${name}</strong>`);
          const ctr = layer.getBounds().getCenter();
          L.marker(ctr, {
            icon: L.divIcon({
              className:"bezirk-label",
              html:`<div>${name}</div>`,
              iconSize:[100,20], iconAnchor:[50,10]
            }),
            interactive:false
          }).addTo(map);
        }
      }).addTo(map);
    });

  // ─────────── Icons ───────────
  const normalIcon = L.icon({ iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', shadowSize:[41,41] });
  const greyIcon   = L.icon({ iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png', iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', shadowSize:[41,41] });
  const popup      = L.popup();

  // ─────────── Globale Variablen ───────────
  let preisDaten = {};                 // In‑Memory Cache
  let currentMarker = null;
  let currentSupermarkt = "";
  let zuletztHochgeladenesBildURL = null;

 // 🔁 Bild-Upload + Stepper
const bildModal = document.getElementById("bildUploadModal");
const bildInput = document.getElementById("bildDateiInput");
const bildInfo  = document.getElementById("bildUploadInfo");
const skipBtn   = document.getElementById("bildUeberspringenBtn");
const nextBtn   = document.getElementById("bildWeiterBtn");

let zuletztHochgeladenesBildURL = null;
let currentSupermarkt = "";
let currentMarker = null;

// Wenn Marker geklickt wurde → Modal öffnen
function openBildUploadUndDannStepper() {
  zuletztHochgeladenesBildURL = null;
  bildInput.value = "";
  bildInfo.textContent = "Kein Bild ausgewählt";
  bildModal.classList.remove("hidden");
}

bildInput.addEventListener("change", () => {
  const file = bildInput.files[0];
  bildInfo.textContent = file ? file.name : "Kein Bild ausgewählt";
});

skipBtn.onclick = () => {
  bildModal.classList.add("hidden");
  openStepper();
};

nextBtn.onclick = async () => {
  const file = bildInput.files[0];
  if (file) {
    const b64 = await fileToBase64(file);
    const res = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: b64,
        fileName: `${currentSupermarkt.replace(/\W+/g, "_")}.jpg`
      })
    });
    const j = await res.json();
    if (res.ok) {
      zuletztHochgeladenesBildURL = j.url;
    }
  }
  bildModal.classList.add("hidden");
  openStepper();
};

  // ─────────── Datei‑Name anzeigen ───────────
  fileInput.addEventListener("change", () => {
    const f = fileInput.files[0];
    bildNameDiv.textContent = f ? f.name : "Kein Bild vorhanden";
  });

  // ─────────── Preise aus Firestore laden ───────────
  async function ladePreiseAusFirestore() {
    const snap = await getDocs(collection(db,"preise"));
    snap.forEach(d => {
      const data = d.data();
      if (data.markt && data.preise) {
        preisDaten[data.markt] = {
          preise: data.preise,
          bild: data.bild || null
        };
      }
    });
    ladeSupermarktMarker();
  }

  // ─────────── Supermarkt‑Marker setzen ───────────
  function ladeSupermarktMarker() {
    fetch("/supermaerkte.json")
      .then(r=>r.json())
      .then(arr=>{
        arr.forEach(markt => {
          const has = preisDaten[markt.name];
          const mk = L.marker(markt.coords,{ icon: has?greyIcon:normalIcon }).addTo(map);
          mk.on("click",()=>{
            currentSupermarkt = markt.name;
            currentMarker     = mk;
            popup
              .setLatLng(markt.coords)
              .setContent(setPopupContent(markt.name))
              .openOn(map);
            setPopupEventListeners();
          });
        });
      });
  }

  // ─────────── Popup‑Content generieren ───────────
  function setPopupContent(name) {
    const d = preisDaten[name] || {};
    let html = `<b>${name}</b><br>` +
      (d.preise
        ? Object.entries(d.preise).map(([p,v])=>`${p}: ${v!=null?v.toFixed(2)+" €":"–"}`).join("<br>")
        : "Keine Preise")
      ;
    if (d.bild) {
      html += `<br><img src="${d.bild}" style="max-width:200px;max-height:150px;"><br>` +
              `<button id="bildLoeschenBtn">🗑️ Bild löschen</button>`;
    }
    html += `<br><button id="bearbeitenBtn">Preise eintragen / bearbeiten</button>`;
    return html;
  }

  // ─────────── Popup‑Event‑Handler (Bearbeiten + Löschen) ───────────
  function setPopupEventListeners() {
    const bp = document.getElementById("bearbeitenBtn");
    if (bp) bp.onclick = openBildUploadUndDannStepper;

    const del = document.getElementById("bildLoeschenBtn");
    if (del) del.onclick = async () => {
      const fn = (preisDaten[currentSupermarkt].bild||"").split("/").pop();
      if (!fn) return;
      await fetch("/api/delete-image", {
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({fileName:fn})
      });
      preisDaten[currentSupermarkt].bild = null;
      await speicherePreisInFirestore(currentSupermarkt, preisDaten[currentSupermarkt].preise, null);
      popup.setContent(setPopupContent(currentSupermarkt)).openOn(map);
      setPopupEventListeners();
    };
  }

  // ─────────── Preis+Bild‑Form öffnen ───────────
  function openFileAndPriceForm() {
    form.reset();
    formTitle.textContent = `Preise bei ${currentSupermarkt}`;
    // Bild‑Name anzeigen (falls vorhanden)
    const url = preisDaten[currentSupermarkt]?.bild;
    bildNameDiv.textContent = url? url.split("/").pop() : "Kein Bild vorhanden";
    modal.classList.remove("hidden");
  }
  closeBtn.onclick = ()=> modal.classList.add("hidden");

  // ─────────── Bild hochladen & Stepper starten ───────────
  form.addEventListener("submit", async e => {
    e.preventDefault();
    // 1) Bild‑Upload (optional)
    const file = fileInput.files[0];
    zuletztHochgeladenesBildURL = null;
    if (file) {
      const b64 = await fileToBase64(file);
      const res = await fetch("/api/upload-image", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          imageBase64: b64,
          fileName:`${currentSupermarkt.replace(/\W+/g,"_")}.jpg`
        })
      });
      const j = await res.json();
      if (res.ok) zuletztHochgeladenesBildURL = j.url;
    }
    modal.classList.add("hidden");
    openStepper(); // → nun Schritt‑Für‑Schritt Preise erfassen
  });

  // ─────────── Hilfs‑Funktion: Base64 aus File ───────────
  function fileToBase64(file) {
    return new Promise((res,rej)=>{
      const r = new FileReader();
      r.onloadend = ()=> res(r.result.split(",")[1]);
      r.onerror   = rej;
      r.readAsDataURL(file);
    });
  }

  // ─────────── Preise speichern in Firestore ───────────
  async function speicherePreisInFirestore(markt, eintraege, bildURL=null) {
    await setDoc(doc(db,"preise",markt.replace(/\W+/g,"_")), {
      markt, preise:eintraege, bild:bildURL||null, zeitstempel:serverTimestamp()
    });
    preisDaten[markt] = { preise:eintraege, bild:bildURL||null };
    if (currentMarker) currentMarker.setIcon(greyIcon);
  }

  // ─────────── Stepper‑Modal (Schrittweise Preiseingabe) ───────────
  const produkte = [
    {name:"Brot",   beschreibung:"Frisches Brot vom Bäcker."},
    {name:"Milch",  beschreibung:"1 Liter Vollmilch, 3,5 % Fett."},
    {name:"Äpfel",  beschreibung:"Ca. 1 kg regionale Äpfel."},
    {name:"Butter", beschreibung:"250 g Markenbutter, Bio."},
    {name:"Nudeln", beschreibung:"500 g Hartweizengrieß‑Nudeln."}
  ];
  let currentStep = 0;
  const stepperModal = document.getElementById("stepperModal");
  const stepContent   = document.getElementById("step-content");
  const prevBtn       = document.getElementById("prevStep");
  const nextBtn       = document.getElementById("nextStep");
  const indicators    = document.getElementById("stepIndicators");
  const closeStepper  = document.getElementById("stepperCloseBtn");

  function renderStep() {
    const p = produkte[currentStep];
    stepContent.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.beschreibung}</p>
      <label>Preis (€):
        <input id="preisInput" type="number" step="0.01" value="${preisDaten[currentSupermarkt]?.preise?.[p.name]||""}"/>
      </label>
    `;
    indicators.innerHTML = "";
    produkte.forEach((_,i)=>{
      const dot = document.createElement("div");
      dot.className = "step-dot"+(i===currentStep?" active":"");
      dot.onclick   = ()=>{ currentStep=i; renderStep(); };
      indicators.appendChild(dot);
    });
  }

  function openStepper() {
    currentStep=0;
    renderStep();
    stepperModal.classList.remove("hidden");
  }
  closeStepper.onclick = ()=> stepperModal.classList.add("hidden");
  prevBtn.onclick      = ()=>{ if(currentStep>0){ currentStep--; renderStep(); }};
  nextBtn.onclick      = ()=>{
    // Wert speichern
    produkte[currentStep].preisErfasst =
      parseFloat(document.getElementById("preisInput").value) || null;

    if (currentStep < produkte.length-1) {
      currentStep++; renderStep();
    } else {
      // Ende: alle Preise sammeln & speichern
      const neuePreise = {};
      produkte.forEach(p => neuePreise[p.name] = p.preisErfasst);
      speicherePreisInFirestore(currentSupermarkt, neuePreise, zuletztHochgeladenesBildURL);
      popup.setContent(setPopupContent(currentSupermarkt)).openOn(map);
      stepperModal.classList.add("hidden");
    }
  };

  // ─────────── Karte neu zeichnen bei Sichtbarkeitswechsel ───────────
  function refreshMap(){
    map.invalidateSize();
    map.eachLayer(layer=>{
      if(layer._icon){ layer._icon.style.display='none'; void layer._icon.offsetHeight; layer._icon.style.display=''; }
      if(layer._path && layer.redraw) layer.redraw();
    });
  }
  window.addEventListener("pageshow",()=>setTimeout(refreshMap,100));
  document.addEventListener("visibilitychange",()=>!document.hidden&&setTimeout(refreshMap,100));

  // ─────────── Starten ───────────
  ladePreiseAusFirestore();
});


