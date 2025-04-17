// Initialize map
const map = L.map('map').setView([51.4825, 7.2174], 13); // Centered on Bochum

// Set up tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Supermarket data (example data, should be dynamically loaded)
const supermarkets = [
  { name: 'Rewe Bochum Querenburg', coordinates: [51.4475, 7.2632] },
  { name: 'Edeka Bochum Innenstadt', coordinates: [51.4825, 7.2125] },
  { name: 'Lidl Bochum Wattenscheid', coordinates: [51.4783, 7.2636] },
  { name: 'Aldi Bochum Dahlhausen', coordinates: [51.4402, 7.2613] },
  { name: 'Penny Bochum', coordinates: [51.4920, 7.2134] }
];

// Add supermarket markers to the map
supermarkets.forEach(supermarket => {
  L.marker(supermarket.coordinates)
    .addTo(map)
    .bindPopup(`<b>${supermarket.name}</b>`);
});

// Price entry form functionality
const priceForm = document.getElementById('price-form');
priceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const supermarket = document.getElementById('supermarket').value;
  const product = document.getElementById('product').value;
  const price = document.getElementById('price').value;

  if (supermarket && product && price) {
    alert(`Preis für ${product} im ${supermarket}: ${price}€`);
    // Logic to save data (e.g., send to a server or local storage)
  }
});
