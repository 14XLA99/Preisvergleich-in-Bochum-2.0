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
  // 1) Milch – Marke vs. Handelsmarke
  {
    id: "milch",
    kategorie: "Milch",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "milch",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Frischmilch 1,5 %, 1 l",
      beschreibung: "Handelsmarke, 1 l",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Weihenstephan Frischmilch 1,5 %, 1 l",
      beschreibung: "Markenprodukt, 1 l",
      bildUrl: ""
    }
  },

  // 2) Butter – Marke vs. Handelsmarke
  {
    id: "butter",
    kategorie: "Butter",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "butter",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Deutsche Markenbutter 250 g",
      beschreibung: "Handelsmarke, 250 g",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Kerrygold Butter 250 g",
      beschreibung: "Markenprodukt, 250 g",
      bildUrl: ""
    }
  },

  // 3) Spaghetti – Marke vs. Handelsmarke
  {
    id: "spaghetti",
    kategorie: "Spaghetti",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "spaghetti",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Spaghetti 500 g",
      beschreibung: "Handelsmarke, 500 g",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Barilla Spaghetti 500 g",
      beschreibung: "Markenprodukt, 500 g",
      bildUrl: ""
    }
  },

  // 4) Cornflakes – Marke vs. Handelsmarke
  {
    id: "cornflakes",
    kategorie: "Cornflakes",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "cornflakes",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Cornflakes",
      beschreibung: "Handelsmarke",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Kellogg's Cornflakes",
      beschreibung: "Markenprodukt",
      bildUrl: ""
    }
  },

  // 5) Haferdrink – Marke vs. Handelsmarke
  {
    id: "haferdrink",
    kategorie: "Haferdrink",
    vergleich: "Marke",
    typ: "marke_vs_handelsmarke",
    handelsmarkeKey: "haferdrink",
    p1: {
      rolle: "handelsmarke",
      nameTemplate: "{handelsmarke} Haferdrink 1 l",
      beschreibung: "Handelsmarke, 1 l",
      bildUrl: ""
    },
    p2: {
      rolle: "marke",
      name: "Alpro Haferdrink 1 l",
      beschreibung: "Markenprodukt, 1 l",
      bildUrl: ""
    }
  },

  // 6) Coca-Cola – Packungsgrößenvergleich
  {
    id: "cola",
    kategorie: "Cola",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Coca-Cola 0,5 l",
      beschreibung: "kleine Flasche, 0,5 l",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Coca-Cola 1,0 l",
      beschreibung: "große Flasche, 1,0 l",
      bildUrl: ""
    }
  },

  // 7) Nutella – Packungsgrößenvergleich
  {
    id: "nutella",
    kategorie: "Nutella",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Nutella 450 g",
      beschreibung: "kleines Glas",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Nutella 750 g",
      beschreibung: "großes Glas",
      bildUrl: ""
    }
  },

  // 8) Haribo – Packungsgrößenvergleich
  {
    id: "haribo",
    kategorie: "Fruchtgummi",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Haribo Goldbären 175/200 g",
      beschreibung: "kleine Packung",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Haribo Goldbären 340 g",
      beschreibung: "große Packung",
      bildUrl: ""
    }
  },

  // 9) Pringles – Packungsgrößenvergleich
  {
    id: "pringles",
    kategorie: "Chips",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Pringles Paprika kleine Packung",
      beschreibung: "kleinere Packung",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Pringles Paprika große Packung",
      beschreibung: "größere Packung",
      bildUrl: ""
    }
  },

  // 10) Kaffee – Packungsgrößenvergleich
  {
    id: "kaffee",
    kategorie: "Kaffee",
    vergleich: "Menge",
    typ: "packungsgroesse",
    p1: {
      rolle: "klein",
      name: "Jacobs Krönung Kaffee 250 g",
      beschreibung: "kleine Packung",
      bildUrl: ""
    },
    p2: {
      rolle: "gross",
      name: "Jacobs Krönung Kaffee 500 g",
      beschreibung: "große Packung",
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
