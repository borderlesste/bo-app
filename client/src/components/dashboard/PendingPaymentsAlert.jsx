import PropTypes from 'prop-types';
import Card from '../Card';
import Button from '../Button';

const PendingPaymentsAlert = ({ stats, formatCurrency, onViewPayments }) => {
  if (!stats.pendingPayments || stats.pendingPayments <= 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <Card variant="accent" className="border-l-4 border-l-yellow-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-ghost-800 dark:text-ghost-100">
                Pagos Pendientes
              </h3>
              <p className="text-ghost-600 dark:text-ghost-300">
                Tienes {formatCurrency(stats.pendingPayments)} en pagos pendientes
              </p>
            </div>
          </div>
          <Button 
            variant="primary"
            onClick={onViewPayments}
          >
            Revisar Pagos
          </Button>
        </div>
      </Card>
    </div>
  );
};

PendingPaymentsAlert.propTypes = {
  stats: PropTypes.object.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  onViewPayments: PropTypes.func
};

export default PendingPaymentsAlert;