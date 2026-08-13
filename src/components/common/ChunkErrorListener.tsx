"use client";

import { useEffect } from "react";

export default function ChunkErrorListener() {
  useEffect(() => {
    // 1. Interceptar fetch de chunks para capturar HTTP 404 antes de que falle el renderizado
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
      
      if (url.includes('/_next/static/chunks/') && response.status === 404) {
        console.warn("🔄 Chunk JS 404 detectado en fetch. Recargando aplicación...");
        const lastReload = sessionStorage.getItem("last_chunk_error_reload");
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 3000) {
          sessionStorage.setItem("last_chunk_error_reload", now.toString());
          window.location.reload();
        }
      }
      return response;
    };

    // 2. Escuchar eventos globales de error en ventana
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = "reason" in event ? (event as PromiseRejectionEvent).reason : (event as ErrorEvent).error;
      const errorStr = String(error || "") + " " + String((event as ErrorEvent)?.message || "") + " " + String(error?.stack || "");

      const isChunkError =
        error?.name === "ChunkLoadError" ||
        errorStr.includes("ChunkLoadError") ||
        errorStr.includes("Loading chunk") ||
        errorStr.includes("Failed to load chunk") ||
        errorStr.includes("404") ||
        errorStr.includes("ERR_ABORTED");

      if (isChunkError) {
        console.warn("🔄 ChunkLoadError detectado en consola. Recargando...");
        const lastReload = sessionStorage.getItem("last_chunk_error_reload");
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 3000) {
          sessionStorage.setItem("last_chunk_error_reload", now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleChunkError, true);
    window.addEventListener("unhandledrejection", handleChunkError, true);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("error", handleChunkError, true);
      window.removeEventListener("unhandledrejection", handleChunkError, true);
    };
  }, []);

  return null;
}
