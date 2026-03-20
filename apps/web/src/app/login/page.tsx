'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [mode, setMode] = useState<'email' | 'otp'>('email');
  const [step, setStep] = useState<'input' | 'otp-verify'>('input');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/v1/auth/login', { email, password });
      setTokens(data.accessToken, data.refreshToken);
      const me = await api.get('/v1/auth/me');
      setUser(me.data);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
