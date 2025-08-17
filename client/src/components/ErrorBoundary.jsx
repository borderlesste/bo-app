import React from 'react';
import PropTypes from 'prop-types';
import logger from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    // Actualiza el estado para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Guarda información del error para debugging
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error using our logger utility
    logger.setContext('ErrorBoundary').error('Component error caught:', error, errorInfo);

    // Report error to monitoring service (only in production)
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }
  }

  reportError = async (error, errorInfo) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous'
      };

      // In a real app, you would send this to your error reporting service
      // For now, we'll just log it
      console.error('Error Report:', errorReport);
      
      // Example: Send to your backend
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  render() {
    if (this.state.hasError) {
      // UI de error personalizada
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <div className="max-w-lg mx-auto p-8 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-red-200 dark:border-red-800">
            <div className="text-center">
              <div className="text-6xl mb-4">😰</div>
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                ¡Oops! Algo salió mal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Ha ocurrido un error inesperado. Por favor, recarga la página o contacta al soporte técnico.
              </p>
              
              {/* Botones de acción */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Recargar página
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Volver atrás
                </button>
              </div>

              {/* Información de error para desarrollo */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Detalles técnicos (solo desarrollo)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded border text-xs font-mono">
                    <div className="text-red-600 dark:text-red-400 font-bold mb-2">
                      {this.state.error && this.state.error.toString()}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Si no hay error, renderiza los children normalmente
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;