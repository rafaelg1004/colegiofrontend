"use client";

import { useEffect } from "react";

export default function ChunkErrorListener() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = "reason" in event ? (event as PromiseRejectionEvent).reason : (event as ErrorEvent).error;
      const message = error?.message || (event as ErrorEvent)?.message || "";

      if (
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("Failed to load chunk") ||
        message.includes("net::ERR_ABORTED")
      ) {
        console.warn("🔄 Versión actualizada detectada. Recargando para obtener la última versión...");
        const lastReload = sessionStorage.getItem("last_chunk_error_reload");
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
          sessionStorage.setItem("last_chunk_error_reload", now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleChunkError);
    window.addEventListener("unhandledrejection", handleChunkError);

    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleChunkError);
    };
  }, []);

  return null;
}
