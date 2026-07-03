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
      name: "Volvic Wasser kleine Flasche",
      beschreibung: "Volvic, kleinere verfügbare Flasche"
    },
    p2: {
      rolle: "gross",
      name: "Volvic Wasser große Flasche",
      beschreibung: "Volvic, größere verfügbare Flasche"
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
      name: "Nutella kleines Glas",
      beschreibung: "Nutella, kleinere verfügbare Glasgröße"
    },
    p2: {
      rolle: "gross",
      name: "Nutella großes Glas",
      beschreibung: "Nutella, größere verfügbare Glasgröße"
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
      name: "Coca-Cola kleine Flasche/Dose",
      beschreibung: "Coca-Cola, kleinere verfügbare Größe"
    },
    p2: {
      rolle: "gross",
      name: "Coca-Cola große Flasche",
      beschreibung: "Coca-Cola, größere verfügbare Größe"
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
      name: "Haribo kleine Packung",
      beschreibung: "Haribo, kleinere verfügbare Packung"
    },
    p2: {
      rolle: "gross",
      name: "Haribo große Packung",
      beschreibung: "Haribo, größere verfügbare Packung"
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
      name: "Weihenstephan H-Milch 1,5 %, 1 l",
      beschreibung: "H-Milch, fettarm, 1,5 % Fett, 1 Liter"
    },
    p2: {
      rolle: "vollmilch",
      name: "Weihenstephan H-Milch 3,5 %, 1 l",
      beschreibung: "H-Milch, Vollmilch, 3,5 % Fett, 1 Liter"
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
      nameTemplate: "{handelsmarke} Spaghetti 500 g",
      beschreibung: "Hartweizengrießnudeln, 500 g"
    },
    p2: {
      rolle: "marke",
      name: "Barilla Spaghetti 500 g",
      beschreibung: "Hartweizengrießnudeln, 500 g"
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
      nameTemplate: "{handelsmarke} Haferdrink 1 l",
      beschreibung: "Haferdrink, 1 Liter"
    },
    p2: {
      rolle: "marke",
      name: "Alpro Haferdrink 1 l",
      beschreibung: "Haferdrink, 1 Liter"
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
      beschreibung: "Stapelchips, möglichst gleiche Sorte"
    },
    p2: {
      rolle: "marke",
      name: "Pringles Stapelchips",
      beschreibung: "Pringles, möglichst gleiche Sorte"
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
      nameTemplate: "{handelsmarke} Kaffee gemahlen 500 g",
      beschreibung: "Filterkaffee, gemahlen, 500 g"
    },
    p2: {
      rolle: "marke",
      name: "Jacobs Krönung Kaffee gemahlen 500 g",
      beschreibung: "Filterkaffee, gemahlen, 500 g"
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
      beschreibung: "Jodsalz / jodiertes Speisesalz"
    },
    p2: {
      rolle: "marke",
      name: "Bad Reichenhaller Jodsalz",
      beschreibung: "Jodsalz / jodiertes Speisesalz"
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
