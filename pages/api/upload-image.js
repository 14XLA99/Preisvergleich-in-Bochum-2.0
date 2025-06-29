// Importiere die 'put'-Funktion von Vercel Blob
import { put } from "@vercel/blob";

// Standard Next.js API Handler
export default async function handler(req, res) {
  // Erlaube nur POST-Anfragen
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  // Base64-Daten und Dateiname aus dem Body extrahieren
  const { imageBase64, fileName } = req.body;

  // Basis-Validierung: Beide Felder müssen Strings sein und nicht leer
  if (
    typeof imageBase64 !== "string" || imageBase64.trim() === "" ||
    typeof fileName !== "string" || fileName.trim() === ""
  ) {
    return res.status(400).json({ error: "Fehlender oder ungültiger Bildinhalt oder Dateiname" });
  }

  try {
    // Falls ein "data:image/jpeg;base64,..."-Prefix existiert → abschneiden
    const base64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    // Base64-String → Buffer umwandeln
    const buffer = Buffer.from(base64, "base64");

    // Upload zu Vercel Blob (public zugänglich, Überschreiben erlaubt)
    const blob = await put(fileName, buffer, {
      access: "public",
      allowOverwrite: true,
    });

    // Rückgabe: URL des gespeicherten Bildes
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    // Fehler im Serverlog sichtbar machen
    console.error("❌ Upload error:", err);

    // Fehler an den Client senden
    res.status(500).json({ error: "Fehler beim Upload", details: err.message });
  }
}
