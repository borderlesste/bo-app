import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  padding = 'default',
  shadow = 'default',
  borderRadius = 'default',
  ...props 
}) => {
  const baseClasses = 'transition-all duration-300 ease-in-out';
  
  const variants = {
    default: 'bg-white dark:bg-ghost-800/80 border border-ghost-200 dark:border-ghost-600/30',
    glass: 'bg-white/70 dark:bg-ghost-800/50 backdrop-blur-md border border-white/20 dark:border-ghost-600/20',
    gradient: 'bg-gradient-to-br from-white to-ghost-50 dark:from-ghost-800/80 dark:to-ghost-900/60 border border-ghost-200 dark:border-ghost-600/30',
    accent: 'bg-gradient-to-br from-ghost-100/50 to-ghost-200/30 dark:from-ghost-700/20 dark:to-ghost-800/30 border border-ghost-300/30 dark:border-ghost-600/40'
  };

  const hoverEffects = {
    true: 'hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]',
    false: ''
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl'
  };

  const borderRadii = {
    none: '',
    sm: 'rounded-md',
    default: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full'
  };

  const classes = [
    baseClasses,
    variants[variant],
    hoverEffects[hover],
    paddings[padding],
    shadows[shadow],
    borderRadii[borderRadius],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'glass', 'gradient', 'accent']),
  hover: PropTypes.bool,
  padding: PropTypes.oneOf(['none', 'sm', 'default', 'lg', 'xl']),
  shadow: PropTypes.oneOf(['none', 'sm', 'default', 'lg', 'xl']),
  borderRadius: PropTypes.oneOf(['none', 'sm', 'default', 'lg', 'full'])
};

export default Card;