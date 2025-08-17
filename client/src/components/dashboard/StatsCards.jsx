import PropTypes from 'prop-types';
import Card from '../Card';

const StatsCards = ({ stats, formatCurrency }) => {
  const statsConfig = [
    {
      title: 'Total Clientes',
      value: stats.totalClients || 0,
      color: 'text-blue-600',
      subtitle: `+${stats.newClientsThisMonth || 0} este mes`,
      subtitleColor: 'text-green-600'
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(stats.monthlyRevenue || 0),
      color: 'text-green-600',
      subtitle: '↗️ +15% vs mes anterior',
      subtitleColor: 'text-green-600'
    },
    {
      title: 'Proyectos Activos',
      value: stats.activeProjects || 0,
      color: 'text-yellow-600',
      subtitle: `${stats.pendingQuotes || 0} cotizaciones pendientes`,
      subtitleColor: 'text-blue-600'
    },
    {
      title: 'Proyectos Completados',
      value: stats.completedProjects || 0,
      color: 'text-purple-600',
      subtitle: `Promedio: ${formatCurrency(stats.averageProjectValue || 0)}`,
      subtitleColor: 'text-ghost-600 dark:text-ghost-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => (
        <Card key={index} variant="gradient" className="text-center group hover:scale-105 transition-transform">
          <div className={`text-4xl font-bold ${stat.color} mb-2`}>
            {stat.value}
          </div>
          <div className="text-sm text-ghost-600 dark:text-ghost-400">
            {stat.title}
          </div>
          <div className={`text-xs mt-1 ${stat.subtitleColor}`}>
            {stat.subtitle}
          </div>
        </Card>
      ))}
    </div>
  );
};

StatsCards.propTypes = {
  stats: PropTypes.object.isRequired,
  formatCurrency: PropTypes.func.isRequired
};

export default StatsCards;