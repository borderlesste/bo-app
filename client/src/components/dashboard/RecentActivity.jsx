import PropTypes from 'prop-types';
import Card from '../Card';
import Button from '../Button';

const RecentActivity = ({ recentActivity, formatDate, getActivityIcon, getActivityColor }) => {
  return (
    <Card variant="gradient">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-ghost-800 dark:text-ghost-100">
          Actividad Reciente
        </h2>
        <Button variant="ghost" size="sm">
          Ver todo
        </Button>
      </div>

      <div className="space-y-4">
        {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <div 
              key={activity.id} 
              className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${getActivityColor(activity.priority)}`}
            >
              <div className="text-2xl flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ghost-800 dark:text-ghost-200 leading-relaxed">
                  {activity.message}
                </p>
                <p className="text-sm text-ghost-500 dark:text-ghost-400 mt-1">
                  {formatDate(activity.time)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-ghost-500 dark:text-ghost-400">
            <div className="text-4xl mb-4">📭</div>
            <p>No hay actividad reciente</p>
          </div>
        )}
      </div>
    </Card>
  );
};

RecentActivity.propTypes = {
  recentActivity: PropTypes.array.isRequired,
  formatDate: PropTypes.func.isRequired,
  getActivityIcon: PropTypes.func.isRequired,
  getActivityColor: PropTypes.func.isRequired
};

export default RecentActivity;