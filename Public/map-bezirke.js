// Lädt und zeigt die Bezirksgrenzen von Bochum auf der Karte
fetch("/bezirke_bo.json")
  .then((res) => res.json())
  .then((geojson) => {
    L.geoJSON(geojson, {
      style: function () {
        return {
          color: "#00458a",       // RUB-Blau
          weight: 2,
          fillColor: "#cce5ff",   // Helles Blau
          fillOpacity: 0.3,
        };
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.name) {
          layer.bindTooltip(feature.properties.name, {
            permanent: true,
            direction: "center",
            className: "bezirk-label"
          });
        }
      }
    }).addTo(map);
  });
