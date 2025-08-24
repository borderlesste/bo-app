import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, CreditCard, Landmark, Copy } from 'lucide-react';
import PropTypes from 'prop-types';

const ClientPaymentModal = ({ isOpen, onClose, payment, onConfirm }) => {
  const { t } = useTranslation(); // Hook de i18n
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [reference, setReference] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (paymentMethod === 'bank' && !reference) {
      alert(t('payment.errors.referenceRequired'));
      return;
    }
    onConfirm({ metodo: paymentMethod, referencia_transferencia: reference });
  };

  const bankDetails = {
    [t('payment.bankDetails.bank')]: 'Banco Ficticio S.A.',
    [t('payment.bankDetails.account')]: '1234-5678-9012-3456',
    [t('payment.bankDetails.beneficiary')]: 'Borderless S.A. de C.V.',
    [t('payment.bankDetails.clabe')]: '012 345 67890123456 7',
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(t('payment.actions.copied'));
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg m-4 transform transition-all">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {t('payment.title')}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Info del pago */}
          <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('payment.fields.concept')}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {payment?.concepto || t('payment.fields.noConcept')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('payment.fields.amount')}
              </span>
              <span className="font-bold text-xl text-violet-600 dark:text-violet-400">
                ${payment?.monto ? payment.monto.toLocaleString() : '0.00'}
              </span>
            </div>
          </div>

          {/* Selección de método de pago */}
          {!paymentMethod ? (
            <div className="text-center space-y-3 pt-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">
                {t('payment.chooseMethod')}
              </h3>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setPaymentMethod('paypal')} 
                  className="flex flex-col items-center justify-center p-4 border-2 border-transparent rounded-lg bg-blue-500 text-white w-40 h-24 hover:bg-blue-600 transition-all"
                >
                  <CreditCard className="w-8 h-8 mb-1" />
                  <span className="font-bold">PayPal</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('bank')} 
                  className="flex flex-col items-center justify-center p-4 border-2 border-transparent rounded-lg bg-gray-600 text-white w-40 h-24 hover:bg-gray-700 transition-all"
                >
                  <Landmark className="w-8 h-8 mb-1" />
                  <span className="font-bold">{t('payment.methods.bank')}</span>
                </button>
              </div>
            </div>
          ) : paymentMethod === 'paypal' ? (
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                {t('payment.paypal.title')}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                {t('payment.paypal.description')}
              </p>
              <p className="text-xs text-gray-500 mt-4">
                {t('payment.simulation')}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                {t('payment.bankData.title')}
              </h3>
              <div className="space-y-2 text-sm">
                {Object.entries(bankDetails).map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">{label}:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-900 dark:text-white">{value}</span>
                      <button 
                        onClick={() => copyToClipboard(value)} 
                        className="text-gray-400 hover:text-violet-500"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label 
                  htmlFor="reference" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('payment.fields.reference')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t('payment.fields.referencePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t flex justify-between items-center">
          <button 
            type="button" 
            onClick={paymentMethod ? () => setPaymentMethod(null) : onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
          >
            {paymentMethod ? t('actions.back') : t('actions.cancel')}
          </button>
          {paymentMethod && (
            <button 
              type="button" 
              onClick={handleConfirm}
              className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              {paymentMethod === 'paypal' 
                ? t('payment.paypal.confirm') 
                : t('payment.bankData.confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

ClientPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  payment: PropTypes.shape({
    concepto: PropTypes.string,
    monto: PropTypes.number,
  }),
  onConfirm: PropTypes.func.isRequired,
};

export default ClientPaymentModal;
