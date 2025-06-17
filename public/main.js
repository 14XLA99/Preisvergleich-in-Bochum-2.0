// 🔥 Firebase- und Leaflet-Imports
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

  // ─────────── Leaflet‑Map initialisieren ───────────
  const map = L.map("map", {
    maxBounds: L.latLngBounds([51.35,7.05],[51.56,7.35]),
    maxBoundsViscosity: 1.0
  }).setView([51.4718,7.2162],12);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    { attribution:'&copy; CARTO &copy; OSM', subdomains:"abcd", maxZoom:19 }
  ).addTo(map);

  // ─────────── Bezirks-Overlay ───────────
  const bezirksFarben = ["#cce5ff","#d4f4dd","#fff3bf","#ffdede","#f5e0ff","#e3f2fd"];
  fetch("/bochum_bezirke.geojson")
    .then(r=>r.json())
    .then(data=>{
      let idx=0;
      L.geoJSON(data,{
        style:()=>({
          color:"#888", weight:1,
          fillColor: bezirksFarben[(idx++)%bezirksFarben.length],
          fillOpacity:0.4
        }),
        onEachFeature:(f,layer)=>{
          const name=f.properties.Bezeichnun||"Unbenannt";
          layer.bindPopup(`<strong>${name}</strong>`);
          const ctr=layer.getBounds().getCenter();
          L.marker(ctr,{
            icon:L.divIcon({
              className:"bezirk-label",
              html:`<div>${name}</div>`,
              iconSize:[100,20], iconAnchor:[50,10]
            }),
            interactive:false
          }).addTo(map);
        }
      }).addTo(map);
    });

  // ─────────── Marker-Icons ───────────
  const normalIcon = L.icon({
    iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34],
    shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize:[41,41]
  });
  const greyIcon = L.icon({
    iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34],
    shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize:[41,41]
  });
  const popup = L.popup();

  // ─────────── State ───────────
  let preisDaten = {};               // In‑Memory Cache pro Markt
  let currentMarker = null;
  let currentSupermarkt = "";
  let zuletztHochgeladenesBildURL = null;

  // ─────────── Produkte für den Stepper ───────────
  const produkte = [
    { name: "Brot",   beschreibung: "Frisches Brot vom Bäcker."   },
    { name: "Milch",  beschreibung: "1 Liter Vollmilch, 3,5 % Fett." },
    { name: "Äpfel",  beschreibung: "Ca. 1 kg regionale Äpfel."  },
    { name: "Butter", beschreibung: "250 g Markenbutter, Bio."   },
    { name: "Nudeln", beschreibung: "500 g Hartweizengrieß‑Nudeln." }
  ];
  let currentStep = 0;

  // ─────────── Dom-Refs für den Stepper ───────────
  const stepperModal = document.getElementById("stepperModal");
  const stepContent    = document.getElementById("step-content");
  const prevBtn        = document.getElementById("prevStep");
  const nextBtn        = document.getElementById("nextStep");
  const indicators     = document.getElementById("stepIndicators");
  const closeStepper   = document.getElementById("stepperCloseBtn");

  // ─────────── Stepper rendern ───────────
  function renderStep() {
    const p = produkte[currentStep];
    stepContent.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.beschreibung}</p>
      <label>Preis (€):
        <input id="preisInput" type="number" step="0.01" value="${p.preisErfasst ?? ''}" />
      </label>
    `;
    // Indikatoren
    indicators.innerHTML = "";
    produkte.forEach((_,i)=>{
      const dot = document.createElement("div");
      dot.className = "step-dot"+(i===currentStep?" active":"");
      dot.onclick   = ()=>{ currentStep=i; renderStep(); };
      indicators.appendChild(dot);
    });
  }

  // ─────────── Stepper öffnen ───────────
  function openStepper() {
    currentStep = 0;
    renderStep();
    stepperModal.classList.remove("hidden");
  }
  closeStepper.onclick = ()=> stepperModal.classList.add("hidden");
  prevBtn.onclick      = ()=>{ if(currentStep>0){ currentStep--; renderStep(); }};
  nextBtn.onclick      = ()=>{
    // Eingabe speichern
    produkte[currentStep].preisErfasst =
      parseFloat(document.getElementById("preisInput").value) || null;
    if (currentStep < produkte.length-1) {
      currentStep++;
      renderStep();
    } else {
      // am Ende: alles sammeln und speichern
      const neuePreise = {};
      produkte.forEach(p=> neuePreise[p.name] = p.preisErfasst);
      speicherePreisInFirestore(currentSupermarkt, neuePreise, zuletztHochgeladenesBildURL)
        .then(()=>{
          popup
            .setContent(setPopupContent(currentSupermarkt))
            .openOn(map);
        });
      stepperModal.classList.add("hidden");
    }
  };

  // ─────────── Firestore‑Leseroutine ───────────
  async function ladePreiseAusFirestore() {
    const snap = await getDocs(collection(db,"preise"));
    snap.forEach(d=>{
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

  // ─────────── Marker auf Karte setzen ───────────
  function ladeSupermarktMarker() {
    fetch("/supermaerkte.json")
      .then(r=>r.json())
      .then(arr=>{
        arr.forEach(markt=>{
          const has = preisDaten[markt.name];
          const mk  = L.marker(markt.coords, { icon: has? greyIcon: normalIcon })
            .addTo(map);
          mk.on("click", ()=>{
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

  // ─────────── Popup‑Inhalt generieren ───────────
  function setPopupContent(name) {
    const d = preisDaten[name] || {};
    let html = `<b>${name}</b><br>` +
      (d.preise
        ? Object.entries(d.preise).map(([p,v])=>`${p}: ${v!=null?v.toFixed(2)+" €":"–"}`).join("<br>")
        : "Keine Preise"
      );
    if (d.bild) {
      html += `<br><img src="${d.bild}" style="max-width:200px;max-height:150px;"><br>` +
              `<button id="bildLoeschenBtn">🗑️ Bild löschen</button>`;
    }
    html += `<br><button id="bearbeitenBtn">Preise eintragen / bearbeiten</button>`;
    return html;
  }

  // ─────────── Popup‑Eventhandler (Bearbeiten + Löschen) ───────────
  function setPopupEventListeners() {
    // ✏️ Bearbeiten → Stepper (mit Bild-Voreinstellung)
    const bp = document.getElementById("bearbeitenBtn");
    if (bp) bp.onclick = ()=>{
      zuletztHochgeladenesBildURL = preisDaten[currentSupermarkt]?.bild || null;
      const gespeicherte = preisDaten[currentSupermarkt]?.preise || {};
      produkte.forEach(p=> p.preisErfasst = gespeicherte[p.name] ?? null);
      openStepper();
    };
    // 🗑️ Bild löschen
    const del = document.getElementById("bildLoeschenBtn");
    if (del) del.onclick = async ()=>{
      const fn = (preisDaten[currentSupermarkt].bild||"").split("/").pop();
      if (!fn) return;
      await fetch("/api/delete-image", {
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ fileName: fn })
      });
      preisDaten[currentSupermarkt].bild = null;
      await speicherePreisInFirestore(currentSupermarkt, preisDaten[currentSupermarkt].preise, null);
      popup.setContent(setPopupContent(currentSupermarkt)).openOn(map);
      setPopupEventListeners();
    };
  }

  // ─────────── Speichern in Firestore ───────────
  async function speicherePreisInFirestore(markt, eintraege, bildURL=null) {
    await setDoc(doc(db,"preise",markt.replace(/\W+/g,"_")), {
      markt, preise:eintraege, bild:bildURL||null, zeitstempel:serverTimestamp()
    });
    preisDaten[markt] = { preise:eintraege, bild:bildURL||null };
    if (currentMarker) currentMarker.setIcon(greyIcon);
  }

  // ─────────── Helper: File → Base64 ───────────
  function fileToBase64(file) {
    return new Promise((res,rej)=>{
      const r = new FileReader();
      r.onloadend = ()=> res(r.result.split(",")[1]);
      r.onerror   = rej;
      r.readAsDataURL(file);
    });
  }

  // ─────────── Karte bei Visibility-Change neu zeichnen ───────────
  function refreshMap(){
    map.invalidateSize();
    map.eachLayer(l=>{
      if(l._icon){
        l._icon.style.display='none';
        void l._icon.offsetHeight;
        l._icon.style.display='';
      }
      if(l._path&&l.redraw) l.redraw();
    });
  }
  window.addEventListener("pageshow",()=>setTimeout(refreshMap,100));
  document.addEventListener("visibilitychange",()=>!document.hidden&&setTimeout(refreshMap,100));

  // ─────────── App starten ───────────
  ladePreiseAusFirestore();
});
