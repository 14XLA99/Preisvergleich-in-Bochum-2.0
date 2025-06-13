import { put } from "@vercel/blob";

export async function POST(request) {
  const { imageBase64, fileName } = await request.json();

  if (!imageBase64 || !fileName) {
    return new Response(JSON.stringify({ message: "Fehlende Daten" }), { status: 400 });
  }

  try {
    const buffer = Buffer.from(imageBase64.split(",")[1], "base64");
    const blob = await put(fileName, buffer, {
      access: "public",
    });

    return new Response(JSON.stringify({ url: blob.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
