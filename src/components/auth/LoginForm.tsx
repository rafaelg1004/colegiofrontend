'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthCookie, clearAuthCookie, saveTokenWithExpiration, isTokenExpired, getAuthToken } from '@/utils/auth';
import { API_URL } from '@/utils/api';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Si ya hay una sesión válida en la cookie, redirigir al dashboard
    const token = getAuthToken();
    const user = localStorage.getItem('user');

    if (token && user && !isTokenExpired(token)) {
      router.replace('/dashboard');
      return;
    }

    // Solo limpiar si no hay sesión válida
    if (!token) {
      localStorage.removeItem('user');
      clearAuthCookie();
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales incorrectas');
      }

      // Guardar información del usuario (no sensible) en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Guardar el token EXCLUSIVAMENTE en la cookie
      saveTokenWithExpiration(data.session.access_token);

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginCard}>
      <div className={styles.header}>
        <h1>EduGestion</h1>
        <p>Bienvenido al Portal Institucional</p>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Correo Electrónico</label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@colegio.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Contraseña</label>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? 'Autenticando...' : 'Entrar al Sistema'}
        </button>
      </form>

      <div className={styles.footer}>
        ¿Olvidaste tu contraseña? <a href="#">Recuperar cuenta</a>
      </div>
    </div>
  );
};
