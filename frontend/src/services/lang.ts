export const getLanguage = (): 'tr' | 'en' => {
  return (localStorage.getItem('language') as 'tr' | 'en') || 'tr';
};

export const setLanguage = (lang: 'tr' | 'en') => {
  localStorage.setItem('language', lang);
};