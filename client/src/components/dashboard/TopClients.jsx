import PropTypes from 'prop-types';
import Card from '../Card';
import Button from '../Button';

const TopClients = ({ topClients, formatCurrency }) => {
  return (
    <Card variant="gradient">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-ghost-800 dark:text-ghost-100">
          Mejores Clientes
        </h2>
        <Button variant="ghost" size="sm">
          Ver más
        </Button>
      </div>

      <div className="space-y-4">
        {Array.isArray(topClients) && topClients.length > 0 ? (
          topClients.map((client, index) => (
            <div key={client.id} className="flex items-center gap-4 p-4 rounded-lg bg-ghost-50 dark:bg-ghost-700/30">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-ghost-800 dark:text-ghost-200 truncate">
                  {client.name}
                </h3>
                <p className="text-sm text-ghost-500 dark:text-ghost-400 truncate">
                  {client.email}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(client.totalSpent)}
                  </span>
                  <span className="text-xs text-ghost-500 dark:text-ghost-400">
                    {client.projectsCount} proyectos
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-ghost-500 dark:text-ghost-400">
            <div className="text-4xl mb-4">👥</div>
            <p>No hay clientes registrados</p>
          </div>
        )}
      </div>
    </Card>
  );
};

TopClients.propTypes = {
  topClients: PropTypes.array.isRequired,
  formatCurrency: PropTypes.func.isRequired
};

export default TopClients;