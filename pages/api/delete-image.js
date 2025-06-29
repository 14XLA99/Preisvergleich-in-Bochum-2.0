// Importiere die 'del'-Funktion von Vercel Blob
import { del } from "@vercel/blob";

// Standard Next.js API Handler
export default async function handler(req, res) {
  // Erlaube nur DELETE-Anfragen
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Nur DELETE erlaubt" });
  }

  // Datei-Name aus dem Body extrahieren
  const { fileName } = req.body;

  // Prüfen, ob fileName gültig ist
  if (typeof fileName !== "string" || fileName.trim() === "") {
    return res.status(400).json({ error: "Fehlender oder ungültiger Dateiname" });
  }

  try {
    // Datei bei Vercel Blob löschen
    await del(fileName);

    // Erfolgsmeldung zurückgeben
    res.status(200).json({ message: "Bild gelöscht" });
  } catch (err) {
    // Fehler im Serverlog sichtbar machen
    console.error("❌ Fehler beim Löschen:", err);

    // Fehler an den Client senden
    res.status(500).json({ error: "Fehler beim Löschen", details: err.message });
  }
}
