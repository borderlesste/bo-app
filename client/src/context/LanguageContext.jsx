import { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import logger from '../utils/logger';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

// Import translations
import esTranslations from '../translations/es.js';
import htTranslations from '../translations/ht.js';
import enTranslations from '../translations/en.js';
import frTranslations from '../translations/fr.js';
import ptTranslations from '../translations/pt.js';

const translationsMap = {
  es: esTranslations,
  ht: htTranslations,
  en: enTranslations,
  fr: frTranslations,
  pt: ptTranslations
};

export const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Cargar idioma guardado o fallback a 'es'
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved && SUPPORTED_LANGUAGES[saved] ? saved : 'es';
  });

  const [translations, setTranslations] = useState(() => {
    return translationsMap[localStorage.getItem('language')] || esTranslations;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Cargar traducciones cuando cambia el idioma
  useEffect(() => {
    setIsLoading(true);
    try {
      logger.setContext('LanguageContext').info(`Loading translations for language: ${currentLanguage}`);
      const loaded = translationsMap[currentLanguage];
      if (loaded) {
        logger.info('Translations loaded: Success');
        setTranslations(loaded);
      } else {
        logger.error(`No translations found for language: ${currentLanguage}`);
        setTranslations(esTranslations);
      }
    } catch (error) {
      logger.error(`Error loading translations for ${currentLanguage}:`, error);
      setTranslations(esTranslations);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  // Cambiar idioma
  const changeLanguage = useCallback((languageCode) => {
    if (SUPPORTED_LANGUAGES[languageCode]) {
      logger.info(`Changing language from ${currentLanguage} to ${languageCode}`);
      setCurrentLanguage(languageCode);
      localStorage.setItem('language', languageCode);
    } else {
      logger.error(`Unsupported language: ${languageCode}`);
    }
  }, [currentLanguage]);

  // Función de traducción
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    if (value === undefined) {
      logger.warn(`Translation key not found: ${key} (Language: ${currentLanguage})`);
      return key;
    }

    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    return value;
  }, [translations, currentLanguage]);

  const value = useMemo(() => ({
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    t,
    isLoading
  }), [currentLanguage, changeLanguage, t, isLoading]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
LanguageProvider.displayName = 'LanguageProvider';