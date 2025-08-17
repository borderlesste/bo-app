import PropTypes from 'prop-types';

const Skeleton = ({ 
  className = '',
  variant = 'rectangular',
  width = 'full',
  height = 'auto',
  animated = true
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  const animationClasses = animated ? 'animate-pulse' : '';
  
  const variants = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-lg'
  };

  const widths = {
    auto: 'w-auto',
    full: 'w-full',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '2/3': 'w-2/3',
    '1/4': 'w-1/4',
    '3/4': 'w-3/4'
  };

  const heights = {
    auto: 'h-auto',
    4: 'h-4',
    6: 'h-6',
    8: 'h-8',
    10: 'h-10',
    12: 'h-12',
    16: 'h-16',
    20: 'h-20',
    24: 'h-24',
    32: 'h-32'
  };

  const classes = [
    baseClasses,
    variants[variant],
    widths[width],
    heights[height],
    animationClasses,
    className
  ].filter(Boolean).join(' ');

  return <div className={classes} />;
};

const SkeletonCard = ({ className = '' }) => (
  <div className={`p-6 ${className}`}>
    <Skeleton variant="rectangular" height="32" className="mb-4" />
    <Skeleton variant="text" height="4" className="mb-2" />
    <Skeleton variant="text" height="4" width="3/4" className="mb-4" />
    <div className="flex space-x-2">
      <Skeleton variant="rectangular" width="1/3" height="8" />
      <Skeleton variant="rectangular" width="1/3" height="8" />
    </div>
  </div>
);

const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={className}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        height="4"
        width={index === lines - 1 ? '2/3' : 'full'}
        className="mb-2 last:mb-0"
      />
    ))}
  </div>
);

Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['text', 'rectangular', 'circular', 'rounded']),
  width: PropTypes.oneOf(['auto', 'full', '1/2', '1/3', '2/3', '1/4', '3/4']),
  height: PropTypes.oneOf(['auto', '4', '6', '8', '10', '12', '16', '20', '24', '32']),
  animated: PropTypes.bool
};

SkeletonCard.propTypes = {
  className: PropTypes.string
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
  className: PropTypes.string
};

export default Skeleton;
export { SkeletonCard, SkeletonText };