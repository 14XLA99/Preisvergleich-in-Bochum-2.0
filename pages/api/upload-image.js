import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false, // wichtig: multipart/form-data selbst parsen
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  try {
    const boundary = req.headers["content-type"].split("boundary=")[1];
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // Parsen mit undokumentiertem, aber leichtem multipart-parser
    const parse = await import("formidable/src/parsers/Formidable.js");
    const { Formidable } = parse.default;
    const form = new Formidable({ multiples: false });

    // Hack: simulate req for Formidable
    const fakeReq = {
      headers: req.headers,
      method: req.method,
      url: req.url,
      socket: req.socket,
      on: (event, cb) => {
        if (event === "data") cb(buffer);
        if (event === "end") cb();
      }
    };

    form.parse(fakeReq, async (err, fields, files) => {
      if (err) {
        console.error("❌ Fehler beim Parsen:", err);
        return res.status(400).json({ error: "Fehler beim Parsen" });
      }

      const file = files.file;
      const fileName = file.originalFilename;

      const fs = await import("fs/promises");
      const fileBuffer = await fs.readFile(file.filepath);

      const blob = await put(fileName, fileBuffer, {
        access: "public",
        allowOverwrite: true
      });

      res.status(200).json({ url: blob.url });
    });
  } catch (err) {
    console.error("❌ Fehler beim Upload:", err);
    res.status(500).json({ error: "Upload fehlgeschlagen", details: err.message });
  }
}

