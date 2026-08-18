'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/utils/api';

export default function ApiDebug() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Interceptor global de peticiones HTTP para toda la aplicación
    if (typeof window !== 'undefined' && !(window as any).__FETCH_LOGGER_INITIALIZED__) {
      (window as any).__FETCH_LOGGER_INITIALIZED__ = true;
      const originalFetch = window.fetch;

      window.fetch = async function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
        const method = (args[1]?.method || 'GET').toUpperCase();

        if (url.includes('/api/')) {
          const startTime = performance.now();
          console.group(`📡 [PETICIÓN HTTP GLOBAL] ${method} ${url}`);
          if (args[1]?.body) {
            try {
              console.log("📤 Body enviado:", JSON.parse(args[1].body as string));
            } catch {
              console.log("📤 Body enviado:", args[1].body);
            }
          }

          try {
            const response = await originalFetch.apply(this, args);
            const duration = (performance.now() - startTime).toFixed(1);
            console.log(`📥 Estado: ${response.status} ${response.statusText} (${duration}ms)`);

            const clone = response.clone();
            clone.json().then(data => {
              console.log("📦 Datos devueltos por el servidor:", data);
              if (Array.isArray(data)) {
                console.table(data);
              } else if (data && typeof data === 'object') {
                const listKey = Object.keys(data).find(k => Array.isArray(data[k]));
                if (listKey && Array.isArray(data[listKey])) {
                  console.log(`📊 Lista encontrada en '${listKey}' (${data[listKey].length} ítems):`);
                  console.table(data[listKey]);
                }
              }
            }).catch(() => {
              clone.text().then(text => console.log("📄 Respuesta texto:", text.substring(0, 150))).catch(() => {});
            }).finally(() => {
              console.groupEnd();
            });

            return response;
          } catch (err: any) {
            console.error("❌ Error de red:", err.message);
            console.groupEnd();
            throw err;
          }
        }

        return originalFetch.apply(this, args);
      };
    }

    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const isLocal = API_URL.includes('localhost');
  const isProduction = !isLocal && (API_URL.includes('vercel') || API_URL.includes('onrender') || API_URL.includes('railway') || !API_URL.includes('localhost'));

  if (!visible) return null;

  return (
    <div 
      className="no-print"
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        padding: '10px 15px',
        background: isLocal ? '#22c55e' : isProduction ? '#ef4444' : '#f59e0b',
        color: 'white',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
      <div><strong>API:</strong> {API_URL}</div>
      <div><strong>Entorno:</strong> {isLocal ? '🟢 LOCAL' : isProduction ? '🔴 PRODUCCIÓN' : '🟡 OTRO'}</div>
    </div>
  );
}
