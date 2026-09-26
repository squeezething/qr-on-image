import { NextRequest } from "next/server";

const MAX_BYTES = 12 * 1024 * 1024;

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host === "::1" || host.endsWith(".local")) return true;
  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some(Number.isNaN)) return false;
  return octets[0] === 10 || octets[0] === 127 || octets[0] === 0 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168);
}

export async function GET(request: NextRequest) {
  try {
    const target = new URL(request.nextUrl.searchParams.get("url") ?? "");
    if (!["http:", "https:"].includes(target.protocol) || isPrivateHost(target.hostname)) return new Response("URL gambar tidak valid.", { status: 400 });

    const response = await fetch(target, { redirect: "follow", headers: { "User-Agent": "QR-on-Image/1.0" } });
    if (!response.ok || !response.body) return new Response("Gambar tidak dapat diambil.", { status: 422 });
    const type = response.headers.get("content-type")?.split(";")[0] ?? "";
    const length = Number(response.headers.get("content-length") ?? 0);
    if (!type.startsWith("image/")) return new Response("URL bukan file gambar.", { status: 415 });
    if (length > MAX_BYTES) return new Response("Ukuran gambar melebihi 12 MB.", { status: 413 });

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return new Response("Ukuran gambar melebihi 12 MB.", { status: 413 });
      }
      chunks.push(value);
    }

    return new Response(new Blob(chunks, { type }), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=300" } });
  } catch {
    return new Response("URL gambar tidak valid.", { status: 400 });
  }
}
