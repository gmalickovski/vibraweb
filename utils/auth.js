export const getAuth = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('isAuthenticated') === 'true';
  }
  return false;
};

export const setAuth = (value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('isAuthenticated', value);
  }
};

export const removeAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isAuthenticated');
  }
};
