import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Toast from './Toast';

let toastId = 0;

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    const newToast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose methods globally
  if (typeof window !== 'undefined') {
    window.showToast = addToast;
    window.clearAllToasts = clearAll;
  }

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>,
    document.body
  );
};

// Toast utility functions
export const toast = {
  success: (message, options = {}) => {
    if (typeof window !== 'undefined' && window.showToast) {
      return window.showToast({
        type: 'success',
        message,
        duration: 5000,
        ...options
      });
    }
  },
  
  error: (message, options = {}) => {
    if (typeof window !== 'undefined' && window.showToast) {
      return window.showToast({
        type: 'error',
        message,
        duration: 7000,
        ...options
      });
    }
  },
  
  warning: (message, options = {}) => {
    if (typeof window !== 'undefined' && window.showToast) {
      return window.showToast({
        type: 'warning',
        message,
        duration: 6000,
        ...options
      });
    }
  },
  
  info: (message, options = {}) => {
    if (typeof window !== 'undefined' && window.showToast) {
      return window.showToast({
        type: 'info',
        message,
        duration: 5000,
        ...options
      });
    }
  },
  
  custom: (options) => {
    if (typeof window !== 'undefined' && window.showToast) {
      return window.showToast(options);
    }
  },
  
  clearAll: () => {
    if (typeof window !== 'undefined' && window.clearAllToasts) {
      window.clearAllToasts();
    }
  }
};

export default ToastContainer;