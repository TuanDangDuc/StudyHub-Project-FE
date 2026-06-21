/**
 * useAuth hook - imported separately to satisfy react-refresh
 * (AuthContext exports both the provider component and non-component functions)
 */
import { useContext } from 'react';
import { AuthContext } from './AuthContextObject';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
