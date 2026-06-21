// produktmatrix.js
// Zentrale Produkt- und Handelsmarkenlogik

export const handelsmarken = {
  rewe: {
    milch: "ja!",
    butter: "ja!",
    spaghetti: "ja!",
    cornflakes: "ja!",
    haferdrink: "REWE Bio"
  },

  edeka: {
    milch: "Gut & Günstig",
    butter: "Gut & Günstig",
    spaghetti: "Gut & Günstig",
    cornflakes: "Gut & Günstig",
    haferdrink: "EDEKA Bio"
  },

  aldi: {
    milch: "Milsani",
    butter: "Milsani",
    spaghetti: "Cucina Nobile",
    cornflakes: "Knusperone",
    haferdrink: "Gut Bio"
  },

  kaufland: {
    milch: "K-Classic",
    butter: "K-Classic",
    spaghetti: "K-Classic",
    cornflakes: "K-Classic",
    haferdrink: "K-Take it veggie"
  },

  netto: {
    milch: "Gutes Land",
    butter: "Gutes Land",
    spaghetti: "Mondo Italiano",
    cornflakes: "Korneck",
    haferdrink: "BioBio"
  },

  penny: {
    milch: "Penny.",
    butter: "Penny.",
    spaghetti: "San Fabio",
    cornflakes: "Penny.",
    haferdrink: "Naturgut"
  },

  lidl: {
    milch: "Milbona",
    butter: "Milbona",
    spaghetti: "Combino",
    cornflakes: "Crownfield",
    haferdrink: "Vemondo"
  },

  globus: {
    milch: "Globus",
    butter: "Globus",
    spaghetti: "Globus",
    cornflakes: "Globus",
    haferdrink: "Globus"
  }
};

export const produktVergleiche = [
  {
    id: "milch",
    kategorie: "Milch",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "milch",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Frischmilch 1,5 %, 1 l",
      beschreibung: "Frischmilch, 1,5 % Fett, 1 Liter",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Weihenstephan Frischmilch 1,5 %, 1 l",
      beschreibung: "Frischmilch, 1,5 % Fett, 1 Liter",
      bildUrl: ""
    }
  },

  {
    id: "butter",
    kategorie: "Butter",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "butter",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Deutsche Markenbutter 250 g",
      beschreibung: "Deutsche Markenbutter, 250 g",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Kerrygold Butter 250 g",
      beschreibung: "Butter, 250 g",
      bildUrl: ""
    }
  },

  {
    id: "spaghetti",
    kategorie: "Spaghetti",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "spaghetti",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Spaghetti 500 g",
      beschreibung: "Hartweizengrießnudeln, 500 g",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Barilla Spaghetti 500 g",
      beschreibung: "Hartweizengrießnudeln, 500 g",
      bildUrl: ""
    }
  },

  {
    id: "cornflakes",
    kategorie: "Cornflakes",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "cornflakes",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Cornflakes",
      beschreibung: "Klassische Cornflakes",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Kellogg's Cornflakes",
      beschreibung: "Klassische Cornflakes",
      bildUrl: ""
    }
  },

  {
    id: "haferdrink",
    kategorie: "Haferdrink",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "haferdrink",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Haferdrink 1 l",
      beschreibung: "Haferdrink, 1 Liter",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Alpro Haferdrink 1 l",
      beschreibung: "Haferdrink, 1 Liter",
      bildUrl: ""
    }
  },

  {
    id: "cola",
    kategorie: "Cola",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Coca-Cola 0,5 l",
      beschreibung: "Coca-Cola, kleine Flasche, 0,5 Liter",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Coca-Cola 1,0 l",
      beschreibung: "Coca-Cola, große Flasche, 1 Liter",
      bildUrl: ""
    }
  },

  {
    id: "nutella",
    kategorie: "Nutella",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Nutella 450 g",
      beschreibung: "Nuss-Nougat-Creme, kleines Glas",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Nutella 750 g",
      beschreibung: "Nuss-Nougat-Creme, großes Glas",
      bildUrl: ""
    }
  },

  {
    id: "haribo",
    kategorie: "Fruchtgummi",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Haribo Goldbären 175/200 g",
      beschreibung: "Fruchtgummi, kleine Packung",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Haribo Goldbären 340 g",
      beschreibung: "Fruchtgummi, große Packung",
      bildUrl: ""
    }
  },

  {
    id: "pringles",
    kategorie: "Chips",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Pringles Paprika kleine Packung",
      beschreibung: "Stapelchips Paprika, kleinere Packung",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Pringles Paprika große Packung",
      beschreibung: "Stapelchips Paprika, größere Packung",
      bildUrl: ""
    }
  },

  {
    id: "kaffee",
    kategorie: "Kaffee",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Jacobs Krönung Kaffee 250 g",
      beschreibung: "Filterkaffee, gemahlen, kleine Packung",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Jacobs Krönung Kaffee 500 g",
      beschreibung: "Filterkaffee, gemahlen, große Packung",
      bildUrl: ""
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
