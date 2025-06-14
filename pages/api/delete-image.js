import { del } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Nur DELETE erlaubt" });
  }

  const { fileName } = req.body;
  if (!fileName) {
    return res.status(400).json({ message: "Fehlender Dateiname" });
  }

  try {
    await del(fileName);
    res.status(200).json({ message: "Bild gelöscht" });
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Löschen", error: err.message });
  }
}
