/** Fetches a generated file, turning auth redirects and JSON error bodies into thrown messages. */
export async function fetchFile(
  url: string,
  init?: RequestInit,
): Promise<{ blob: Blob; filename: string | null }> {
  const res = await fetch(url, { credentials: "same-origin", ...init });
  const contentType = res.headers.get("Content-Type") ?? "";

  if (res.redirected && new URL(res.url).pathname === "/login") {
    throw new Error("Sesi login berakhir. Silakan login ulang lalu coba unduh lagi.");
  }

  if (!res.ok) {
    let message = "Gagal mengunduh berkas.";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  if (contentType.includes("text/html")) {
    throw new Error("Server mengembalikan halaman HTML, bukan file laporan. Silakan muat ulang halaman lalu coba lagi.");
  }

  const disposition = res.headers.get("Content-Disposition") ?? "";
  return { blob: await res.blob(), filename: /filename="([^"]+)"/.exec(disposition)?.[1] ?? null };
}

/** Fetches a file URL and triggers a save-as download, so callers can show a real loading
 * state while the file is generated server-side (a plain `<a download>` gives no such signal). */
export async function downloadFile(
  url: string,
  filenameFallback: string,
  init?: RequestInit,
): Promise<void> {
  const { blob, filename } = await fetchFile(url, init);

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename ?? filenameFallback;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
