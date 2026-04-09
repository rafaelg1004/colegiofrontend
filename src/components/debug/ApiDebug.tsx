'use client';

import { API_URL } from '@/utils/api';

export default function ApiDebug() {
  const isLocal = API_URL.includes('localhost');
  const isProduction = !isLocal && (API_URL.includes('vercel') || API_URL.includes('onrender') || API_URL.includes('railway') || !API_URL.includes('localhost'));

  return (
    <div style={{
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
