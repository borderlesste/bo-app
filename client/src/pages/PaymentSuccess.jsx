import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, CreditCard, FileText } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success: showSuccess } = useToast();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = searchParams.get('token');
  const payerID = searchParams.get('PayerID');

  useEffect(() => {
    const processPayPalReturn = async () => {
      if (!token || !payerID) {
        setLoading(false);
        return;
      }

      try {
        // Capture the PayPal payment
        const response = await fetch('/api/payment-gateway/paypal/capture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pedido_id: token,
            payer_id: payerID,
            client_email: 'payment@success.com'
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setPaymentDetails(result.data);
          showSuccess('¡Pago procesado exitosamente!');
        }
      } catch (error) {
        console.error('Error processing PayPal return:', error);
      } finally {
        setLoading(false);
      }
    };

    processPayPalReturn();
  }, [token, payerID, showSuccess]);

  const handleContinue = () => {
    navigate('/client/payments');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Procesando su pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Su pago ha sido procesado correctamente. Recibirá un correo de confirmación en breve.
          </p>

          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detalles del Pago
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Transacción:</span>
                  <span className="font-mono text-sm">{paymentDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold">${paymentDetails.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span>PayPal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completado
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Ver mis Pagos
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            
            <div className="flex space-x-4">
              <Link
                to="/client/dashboard"
                className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Dashboard
              </Link>
              <Link
                to="/client/invoices"
                className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FileText className="mr-2 h-5 w-5" />
                Facturas
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ¿Necesita ayuda? {' '}
            <Link to="/contacto" className="font-medium text-blue-600 hover:text-blue-500">
              Contáctenos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;