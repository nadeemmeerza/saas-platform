// lib/auth-utils.ts
import { getAuthToken, verifyToken } from './auth';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const token = await getAuthToken();
  
  if (!token) {
    return null;
  }
  
  const user = verifyToken(token);
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  
  return user;
}