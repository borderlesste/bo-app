import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import logger from '../utils/logger';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import LanguageContext from './languageContext';

// Import all translations statically
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

// Language Provider Component
const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('es');
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = () => {
      try {
        setIsLoading(true);
        logger.setContext('LanguageContext').info(`Loading translations for language: ${currentLanguage}`);
        
        const translations = translationsMap[currentLanguage];
        if (translations) {
          logger.info('Translations loaded: Success');
          console.log('✅ Loaded translations for', currentLanguage, ':', translations);
          setTranslations(translations);
        } else {
          logger.error(`No translations found for language: ${currentLanguage}`);
          // Fallback to Spanish
          console.log('⚠️ Falling back to Spanish translations');
          setTranslations(translationsMap.es || {});
        }
      } catch (error) {
        logger.error(`Error loading translations for ${currentLanguage}:`, error);
        // Fallback to Spanish
        setTranslations(translationsMap.es || {});
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = useCallback((languageCode) => {
    if (SUPPORTED_LANGUAGES[languageCode]) {
      console.log('🔄 Changing language from', currentLanguage, 'to', languageCode);
      setCurrentLanguage(languageCode);
      localStorage.setItem('language', languageCode);
    } else {
      console.error('❌ Unsupported language:', languageCode);
    }
  }, [currentLanguage]);

  const t = useCallback((key, params = {}) => {
    // Return key if translations are still loading
    if (isLoading) {
      return key;
    }
    
    // If no translations loaded, show key
    if (Object.keys(translations).length === 0) {
      console.warn(`❌ No translations loaded for key: ${key}`);
      return key;
    }
    
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    if (value === undefined) {
      console.warn(`❌ Translation key not found: ${key}`, 'Language:', currentLanguage);
      return key;
    }
    
    // Replace parameters in translation
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }
    
    return value;
  }, [isLoading, translations, currentLanguage]);

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

export default LanguageProvider;