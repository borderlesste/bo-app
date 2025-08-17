import { useLanguage } from './useLanguage';

export const useTranslation = () => {
  const { t, currentLanguage, changeLanguage, isLoading, supportedLanguages } = useLanguage();
  
  return {
    t,
    language: currentLanguage,
    changeLanguage,
    isLoading,
    supportedLanguages
  };
};

export default useTranslation;