"use client";

import { useEffect } from "react";

export default function ChunkErrorListener() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = "reason" in event ? (event as PromiseRejectionEvent).reason : (event as ErrorEvent).error;
      const errorStr = String(error || "") + " " + String((event as ErrorEvent)?.message || "");

      const isChunkError =
        error?.name === "ChunkLoadError" ||
        errorStr.includes("ChunkLoadError") ||
        errorStr.includes("Loading chunk") ||
        errorStr.includes("Failed to load chunk") ||
        errorStr.includes("404") ||
        errorStr.includes("ERR_ABORTED");

      if (isChunkError) {
        console.warn("🔄 ChunkLoadError detectado en navegador. Recargando automáticamente...");
        const lastReload = sessionStorage.getItem("last_chunk_error_reload");
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
          sessionStorage.setItem("last_chunk_error_reload", now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleChunkError, true);
    window.addEventListener("unhandledrejection", handleChunkError, true);

    return () => {
      window.removeEventListener("error", handleChunkError, true);
      window.removeEventListener("unhandledrejection", handleChunkError, true);
    };
  }, []);

  return null;
}
