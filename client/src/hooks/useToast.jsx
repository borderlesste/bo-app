import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
      onClose: () => removeToast(id)
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const value = {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id}
          className="pointer-events-auto"
          style={{ 
            zIndex: 50 + index,
            top: `${4 + index * 70}px`,
            right: '16px',
            position: 'fixed'
          }}
        >
          <ToastComponent {...toast} />
        </div>
      ))}
    </div>
  );
};

const ToastComponent = ({ 
  message, 
  type = 'info', 
  onClose
}) => {
  const types = {
    success: {
      bg: 'bg-green-500',
      text: 'text-white',
      icon: '✅'
    },
    error: {
      bg: 'bg-red-500', 
      text: 'text-white',
      icon: '❌'
    },
    warning: {
      bg: 'bg-yellow-500',
      text: 'text-white', 
      icon: '⚠️'
    },
    info: {
      bg: 'bg-blue-500',
      text: 'text-white',
      icon: 'ℹ️'
    }
  };

  return (
    <div className="animate-slideInLeft">
      <div className={`
        ${types[type].bg} ${types[type].text}
        px-6 py-4 rounded-lg shadow-xl
        flex items-center space-x-3
        max-w-sm backdrop-blur-sm
        border border-white/20
        transition-all duration-300
      `}>
        <span className="text-lg">{types[type].icon}</span>
        <p className="font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto text-white/80 hover:text-white transition-colors duration-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

ToastContainer.propTypes = {
  toasts: PropTypes.array.isRequired
};

ToastComponent.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  onClose: PropTypes.func.isRequired
};