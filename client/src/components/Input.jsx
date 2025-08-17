import PropTypes from 'prop-types';
import { useState } from 'react';

const Input = ({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  icon = null,
  iconPosition = 'left',
  ...props 
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const baseClasses = 'w-full px-4 py-3 border rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const normalClasses = 'border-gray-300 dark:border-secondary/30 bg-white dark:bg-dark/50 text-dark dark:text-light focus:border-primary dark:focus:border-secondary focus:ring-primary/20 dark:focus:ring-secondary/20';
  
  const errorClasses = 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300 focus:border-red-500 focus:ring-red-500/20';

  const classes = [
    baseClasses,
    error ? errorClasses : normalClasses,
    icon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : '',
    type === 'password' ? 'pr-12' : '',
    className
  ].filter(Boolean).join(' ');

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-dark dark:text-light">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        
        <input
          type={type === 'password' && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={classes}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
        
        {icon && iconPosition === 'right' && type !== 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 animate-slideInLeft">
          {error}
        </p>
      )}
      
      {focused && !error && (
        <div className="h-1 bg-gradient-to-r from-primary to-secondary rounded-full animate-scaleIn"></div>
      )}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right'])
};

export default Input;