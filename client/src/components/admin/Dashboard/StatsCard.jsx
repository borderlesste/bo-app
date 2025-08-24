import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      trend: change >= 0 ? 'text-green-600' : 'text-red-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      trend: change >= 0 ? 'text-green-600' : 'text-red-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      trend: change >= 0 ? 'text-green-600' : 'text-red-600'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      trend: change >= 0 ? 'text-green-600' : 'text-red-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      trend: change >= 0 ? 'text-green-600' : 'text-red-600'
    }
  };

  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          
          {change !== undefined && change !== null && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${classes.trend}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs anterior</span>
            </div>
          )}
        </div>
        
        <div className={`${classes.bg} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${classes.icon}`} />
        </div>
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange', 'red'])
};

export default StatsCard;