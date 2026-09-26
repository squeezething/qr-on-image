"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ImagePlus, Link2, LoaderCircle, QrCode, ScanLine, Upload, X } from "lucide-react";
import { readBarcodes } from "zxing-wasm/reader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Detection = {
  rawValue: string;
  boundingBox: { x: number; y: number; width: number; height: number };
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [results, setResults] = useState<Detection[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => imageUrl.startsWith("blob:") && URL.revokeObjectURL(imageUrl), [imageUrl]);

  async function scan(source: string) {
    setStatus("loading");
    setMessage("");
    setResults([]);
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error("Tautan tidak mengarah ke file gambar.");
      const bitmap = await createImageBitmap(blob);
      const decoded = await readBarcodes(blob, { formats: ["QRCode"], tryHarder: true, maxNumberOfSymbols: 255 });
      const found = decoded.filter((item) => item.isValid).map(({ text, position }) => {
        const points = Object.values(position);
        const xs = points.map((point) => point.x);
        const ys = points.map((point) => point.y);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        return { rawValue: text, boundingBox: { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y } };
      });
      const preview = URL.createObjectURL(blob);
      setImageUrl((current) => {
        if (current.startsWith("blob:")) URL.revokeObjectURL(current);
        return preview;
      });
      setImageSize({ width: bitmap.width, height: bitmap.height });
      setResults(found);
      setStatus("done");
      setMessage(found.length ? `${found.length} QR ditemukan` : "Tidak ada QR yang terbaca. Coba gambar yang lebih tajam atau lebih besar.");
      bitmap.close();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Gambar gagal diproses.");
    }
  }

  function scanUrl(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    if (trimmed) scan(`/api/image?url=${encodeURIComponent(trimmed)}`);
  }

  function scanFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Pilih file gambar PNG, JPG, WEBP, atau format gambar lain.");
      return;
    }
    const source = URL.createObjectURL(file);
    scan(source).finally(() => URL.revokeObjectURL(source));
  }

  async function copy(value: string, index: number) {
    await navigator.clipboard.writeText(value);
    setCopied(index);
    window.setTimeout(() => setCopied(null), 1400);
  }

  function reset() {
    setUrl("");
    setImageUrl("");
    setResults([]);
    setStatus("idle");
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-[#090b0a] text-[#f4f6ef] selection:bg-[#c7ff42] selection:text-black">
      <div className="grid-bg min-h-screen">
        <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#c7ff42] text-black shadow-[0_0_30px_rgba(199,255,66,.18)]">
              <QrCode className="size-5" strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-display text-lg font-bold tracking-[-.02em]">QR Panen</p>
              <p className="text-xs text-white/40">Multi-code image scanner</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-white/50 sm:flex">
            <span className="size-1.5 rounded-full bg-[#c7ff42] shadow-[0_0_8px_#c7ff42]" />
            Diproses di browser
          </span>
        </header>

        <section className="mx-auto w-full max-w-[1440px] px-5 pb-10 pt-6 sm:px-8 lg:px-12 lg:pt-12">
          <div className="mb-8 max-w-3xl">
            <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[.2em] text-[#c7ff42]">
              <ScanLine className="size-4" /> Mesin pembaca QR
            </p>
            <h1 className="font-display text-4xl font-bold leading-[.96] tracking-[-.055em] sm:text-6xl lg:text-7xl">
              Satu gambar.<br /><span className="text-white/38">Semua QR terangkat.</span>
            </h1>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#101311] shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[.14em] text-white/45">
                  <ImagePlus className="size-4" /> Sumber gambar
                </div>
                {status !== "idle" && (
                  <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-white/45 hover:bg-white/8 hover:text-white">
                    <X /> Bersihkan
                  </Button>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <form onSubmit={scanUrl} className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                    <Input
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://contoh.com/gambar-qr.jpg"
                      aria-label="URL gambar"
                      className="h-12 rounded-xl border-white/10 bg-black/25 pl-10 text-base text-white shadow-none placeholder:text-white/28 focus-visible:border-[#c7ff42]/70 focus-visible:ring-[#c7ff42]/15"
                    />
                  </div>
                  <Button type="submit" disabled={!url.trim() || status === "loading"} className="h-12 rounded-xl bg-[#c7ff42] px-5 font-bold text-black hover:bg-[#d6ff73]">
                    {status === "loading" ? <LoaderCircle className="animate-spin" /> : <ScanLine />}
                    <span className="hidden sm:inline">Pindai</span>
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3 text-xs text-white/25 before:h-px before:flex-1 before:bg-white/8 after:h-px after:flex-1 after:bg-white/8">ATAU</div>

                {!imageUrl ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => { event.preventDefault(); setDragging(false); scanFile(event.dataTransfer.files[0]); }}
                    className={`group flex min-h-[360px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed transition ${dragging ? "border-[#c7ff42] bg-[#c7ff42]/8" : "border-white/14 bg-white/[.025] hover:border-white/30 hover:bg-white/[.045]"}`}
                  >
                    <span className="mb-5 grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[.05] text-white/60 transition group-hover:-translate-y-1 group-hover:text-[#c7ff42]">
                      <Upload className="size-7" />
                    </span>
                    <span className="font-display text-xl font-semibold">Tarik gambar ke sini</span>
                    <span className="mt-2 text-sm text-white/38">atau klik untuk memilih file</span>
                  </button>
                ) : (
                  <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black/50 p-2">
                    <div className="relative mx-auto w-fit max-w-full">
                    <img src={imageUrl} alt="Gambar yang sedang dipindai" className="block max-h-[604px] max-w-full object-contain" />
                    {results.map((result, index) => (
                      <span
                        key={`${result.rawValue}-${index}`}
                        className="pointer-events-none absolute border-2 border-[#c7ff42] bg-[#c7ff42]/10 shadow-[0_0_0_1px_rgba(0,0,0,.35),0_0_22px_rgba(199,255,66,.4)]"
                        style={{
                          left: `${(result.boundingBox.x / imageSize.width) * 100}%`,
                          top: `${(result.boundingBox.y / imageSize.height) * 100}%`,
                          width: `${(result.boundingBox.width / imageSize.width) * 100}%`,
                          height: `${(result.boundingBox.height / imageSize.height) * 100}%`,
                        }}
                      >
                        <b className="absolute -left-px -top-7 rounded-t bg-[#c7ff42] px-2 py-1 font-mono text-[10px] text-black">QR {String(index + 1).padStart(2, "0")}</b>
                      </span>
                    ))}
                    {status === "loading" && <div className="absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm"><LoaderCircle className="size-9 animate-spin text-[#c7ff42]" /></div>}
                    </div>
                  </div>
                )}
                <Input ref={fileRef} type="file" accept="image/*" onChange={(event) => scanFile(event.target.files?.[0])} className="hidden" />
              </div>
            </div>

            <aside className="overflow-hidden rounded-[28px] border border-white/10 bg-[#101311] xl:min-h-[670px]">
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[.14em] text-white/45"><QrCode className="size-4" /> Hasil ekstraksi</div>
                <span className="rounded-full bg-white/[.06] px-2.5 py-1 font-mono text-xs text-white/45">{results.length.toString().padStart(2, "0")}</span>
              </div>

              <div className="p-5 sm:p-6">
                {status === "idle" && (
                  <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                    <div className="scan-orbit mb-7 grid size-28 place-items-center rounded-full border border-white/8"><ScanLine className="size-9 text-white/18" /></div>
                    <h2 className="font-display text-xl font-semibold text-white/70">Belum ada yang dipindai</h2>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-white/32">Tempel URL atau unggah gambar. Semua QR yang terbaca akan muncul di sini.</p>
                  </div>
                )}

                {status !== "idle" && (
                  <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${status === "error" ? "border-red-400/25 bg-red-400/8 text-red-200" : "border-white/8 bg-white/[.03] text-white/55"}`} aria-live="polite">
                    {status === "loading" ? "Memindai seluruh area gambar…" : message}
                  </div>
                )}

                <div className="space-y-3">
                  {results.map((result, index) => (
                    <article key={`${result.rawValue}-${index}`} className="group rounded-2xl border border-white/9 bg-black/20 p-4 transition hover:border-[#c7ff42]/35">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-[.16em] text-[#c7ff42]">QR {String(index + 1).padStart(2, "0")}</span>
                        <Button variant="ghost" size="icon-sm" onClick={() => copy(result.rawValue, index)} aria-label={`Salin hasil QR ${index + 1}`} className="text-white/38 hover:bg-white/8 hover:text-white">
                          {copied === index ? <Check className="text-[#c7ff42]" /> : <Copy />}
                        </Button>
                      </div>
                      <p className="break-all font-mono text-sm leading-6 text-white/80">{result.rawValue}</p>
                      {/^https?:\/\//i.test(result.rawValue) && <a href={result.rawValue} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-white/38 underline decoration-white/15 underline-offset-4 hover:text-[#c7ff42]">Buka tautan ↗</a>}
                    </article>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
