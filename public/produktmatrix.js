// produktmatrix.js
// Zentrale Produkt- und Vergleichslogik

export const handelsmarken = {
  rewe: {
    spaghetti: "ja!",
    haferdrink: "REWE Bio",
    stapelchips: "ja!",
    kaffee: "ja!",
    jodsalz: "ja!"
  },

  edeka: {
    spaghetti: "Gut & Günstig",
    haferdrink: "EDEKA Bio",
    stapelchips: "Gut & Günstig",
    kaffee: "Gut & Günstig",
    jodsalz: "Gut & Günstig"
  },

  aldi: {
    spaghetti: "Cucina Nobile",
    haferdrink: "Gut Bio",
    stapelchips: "Sun Snacks",
    kaffee: "Barissimo Classic",
    jodsalz: "Le Gusto"
  },

  kaufland: {
    spaghetti: "K-Classic",
    haferdrink: "K-Take it veggie",
    stapelchips: "K-Classic",
    kaffee: "K-Classic",
    jodsalz: "K-Classic"
  },

  netto: {
    spaghetti: "Mondo Italiano",
    haferdrink: "BioBio",
    stapelchips: "Clarkys",
    kaffee: "Cafèt",
    jodsalz: "Carat"
  },

  penny: {
    spaghetti: "San Fabio",
    haferdrink: "Naturgut",
    stapelchips: "Bravo",
    kaffee: "San Fabio",
    jodsalz: "Penny"
  },

  lidl: {
    spaghetti: "Combino",
    haferdrink: "Vemondo",
    stapelchips: "Snack Day",
    kaffee: "Bellarom",
    jodsalz: "Kania"
  },

  globus: {
    spaghetti: "Jeden Tag",
    haferdrink: "Jeden Tag",
    stapelchips: "Jeden Tag",
    kaffee: "Jeden Tag",
    jodsalz: "Jeden Tag"
  }
};

export const produktVergleiche = [
  {
    id: "volvic",
    kategorie: "Wasser",
    vergleich: "Menge",
    typ: "packungsgroesse",
    bildUrl: "/img/wasser.png",
    p1: {
      rolle: "klein",
      name: "Volvic Natürliches Mineralwasser",
      groesse: "0,5 l",
      beschreibung: "Volvic Mineralwasser in der kleinen PET-Flasche."
    },
    p2: {
      rolle: "gross",
      name: "Volvic Natürliches Mineralwasser",
      groesse: "1,5 l",
      beschreibung: "Volvic Mineralwasser in der großen PET-Flasche."
    }
  },

  {
    id: "nutella",
    kategorie: "Nuss-Nougat-Creme",
    vergleich: "Menge",
    typ: "packungsgroesse",
    bildUrl: "/img/nutella.png",
    p1: {
      rolle: "klein",
      name: "Nutella Nuss-Nougat-Creme",
      groesse: "500 g",
      beschreibung: "Nutella im kleineren Glas."
    },
    p2: {
      rolle: "gross",
      name: "Nutella Nuss-Nougat-Creme",
      groesse: "750 g",
      beschreibung: "Nutella im größeren Glas."
    }
  },

  {
    id: "cola",
    kategorie: "Cola",
    vergleich: "Menge",
    typ: "packungsgroesse",
    bildUrl: "/img/cola.png",
    p1: {
      rolle: "klein",
      name: "Coca-Cola Classic PET-Flasche",
      groesse: "0,33 l",
      beschreibung: "Coca-Cola Classic in der kleinen PET-Flasche. Keine Dose verwenden."
    },
    p2: {
      rolle: "gross",
      name: "Coca-Cola Classic PET-Flasche",
      groesse: "1,25 l",
      beschreibung: "Coca-Cola Classic in der großen PET-Flasche. Keine Dose verwenden."
    }
  },

  {
    id: "haribo",
    kategorie: "Fruchtgummi",
    vergleich: "Menge",
    typ: "packungsgroesse",
    bildUrl: "/img/haribo.png",
    p1: {
      rolle: "klein",
      name: "Haribo Fruchtgummi",
      groesse: "175 g",
      beschreibung: "Haribo-Fruchtgummi in einer kleinen Packung. Wenn möglich gleiche Sorte wie bei der großen Packung verwenden."
    },
    p2: {
      rolle: "gross",
      name: "Haribo Fruchtgummi",
      groesse: "340 g",
      beschreibung: "Haribo-Fruchtgummi in einer großen Packung. Wenn möglich gleiche Sorte wie bei der kleinen Packung verwenden."
    }
  },

  {
    id: "h_milch_fett",
    kategorie: "H-Milch",
    vergleich: "Fettgehalt",
    typ: "fettgehalt",
    bildUrl: "/img/Milch.png",
    p1: {
      rolle: "fettarm",
      name: "Weihenstephan H-Milch 1,5 %",
      groesse: "1 l",
      beschreibung: "Weihenstephan haltbare Milch mit 1,5 % Fett."
    },
    p2: {
      rolle: "vollmilch",
      name: "Weihenstephan H-Milch 3,5 %",
      groesse: "1 l",
      beschreibung: "Weihenstephan haltbare Milch mit 3,5 % Fett."
    }
  },

  {
    id: "spaghetti",
    kategorie: "Spaghetti",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "spaghetti",
    bildUrl: "/img/spaghetti.png",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Spaghetti",
      groesse: "500 g",
      beschreibung: "Spaghetti der Handelsmarke."
    },
    p2: {
      rolle: "marke",
      name: "Barilla Spaghetti Nr. 5",
      groesse: "500 g",
      beschreibung: "Barilla Spaghetti."
    }
  },

  {
    id: "haferdrink",
    kategorie: "Haferdrink",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "haferdrink",
    bildUrl: "/img/haferdrink.png",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Haferdrink",
      groesse: "1 l",
      beschreibung: "Haferdrink der Handelsmarke, möglichst ungekühlt und natur/klassisch."
    },
    p2: {
      rolle: "marke",
      name: "Alpro Haferdrink",
      groesse: "1 l",
      beschreibung: "Alpro Haferdrink, möglichst natur/klassisch."
    }
  },

  {
    id: "stapelchips",
    kategorie: "Stapelchips",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "stapelchips",
    bildUrl: "/img/chips.png",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Stapelchips",
      groesse: "175 g",
      beschreibung: "Stapelchips der Handelsmarke. Möglichst gleiche Sorte wie Pringles verwenden."
    },
    p2: {
      rolle: "marke",
      name: "Pringles Stapelchips",
      groesse: "185 g",
      beschreibung: "Pringles Stapelchips. Möglichst gleiche Sorte wie die Handelsmarke verwenden."
    }
  },

  {
    id: "kaffee",
    kategorie: "Kaffee",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "kaffee",
    bildUrl: "/img/kaffee.png",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Kaffee gemahlen",
      groesse: "500 g",
      beschreibung: "Gemahlener Filterkaffee der Handelsmarke."
    },
    p2: {
      rolle: "marke",
      name: "Jacobs Krönung Kaffee gemahlen",
      groesse: "500 g",
      beschreibung: "Jacobs Krönung Filterkaffee, gemahlen."
    }
  },

  {
    id: "jodsalz",
    kategorie: "Jodsalz",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "jodsalz",
    bildUrl: "/img/salz.png",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Jodsalz",
      groesse: "500 g",
      beschreibung: "Jodiertes Speisesalz der Handelsmarke."
    },
    p2: {
      rolle: "marke",
      name: "Bad Reichenhaller Jodsalz",
      groesse: "500 g",
      beschreibung: "Bad Reichenhaller jodiertes Speisesalz."
    }
  }
];

export function getProduktVergleicheFuerMarkt(chain) {
  const marken = handelsmarken[chain];

  return produktVergleiche.map((vergleich) => {
    const copy = structuredClone(vergleich);

    ["p1", "p2"].forEach((seite) => {
      const produkt = copy[seite];

      if (produkt.rolle === "handelsmarke") {
        const handelsmarke =
          marken?.[vergleich.handelsmarkeKey] || "Handelsmarke";

        produkt.handelsmarke = handelsmarke;
        produkt.name = produkt.nameTemplate.replace(
          "{handelsmarke}",
          handelsmarke
        );
      }
    });

    return copy;
  });
}
