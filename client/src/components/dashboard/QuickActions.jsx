import PropTypes from 'prop-types';
import Card from '../Card';
import Button from '../Button';

const QuickActions = ({ onActionClick }) => {
  const actions = [
    {
      id: 'new_quote',
      icon: '📋',
      label: 'Nueva Cotización',
      variant: 'primary'
    },
    {
      id: 'add_client',
      icon: '👤',
      label: 'Agregar Cliente',
      variant: 'secondary'
    },
    {
      id: 'register_payment',
      icon: '💰',
      label: 'Registrar Pago',
      variant: 'accent'
    },
    {
      id: 'view_reports',
      icon: '📊',
      label: 'Ver Reportes',
      variant: 'ghost'
    }
  ];

  return (
    <div className="mt-8">
      <Card variant="gradient">
        <h2 className="text-xl font-semibold text-ghost-800 dark:text-ghost-100 mb-6">
          Acciones Rápidas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Button 
              key={action.id}
              variant={action.variant} 
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => onActionClick && onActionClick(action.id)}
            >
              <span className="text-2xl">{action.icon}</span>
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};

QuickActions.propTypes = {
  onActionClick: PropTypes.func
};

export default QuickActions;