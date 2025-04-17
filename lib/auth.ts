import jwt from 'jsonwebtoken';

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwt.decode(token);
    if (!decoded) return false;

    const { exp } = decoded as { exp: number };
    if (Date.now() >= exp * 1000) {
      localStorage.removeItem('token');
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};