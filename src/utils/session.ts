import { getCookie, setCookie, deleteCookie } from 'cookies-next';

export const setSession = (sessionId: string) => {
  setCookie('session', sessionId, { maxAge: 60 * 60 * 24 }); // 1 day
};

export const getSession = () => {
  return getCookie('session');
};

export const clearSession = () => {
  deleteCookie('session');
};
