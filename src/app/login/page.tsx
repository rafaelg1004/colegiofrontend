'use client';

import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem',
      background: 'radial-gradient(circle at top right, rgba(79, 70, 229, 0.1), transparent), radial-gradient(circle at bottom left, rgba(129, 140, 248, 0.1), transparent)'
    }}>
      <LoginForm />
    </div>
  );
}
