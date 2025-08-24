import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  const token = searchParams.get('token');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/client/payments');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleRetry = () => {
    navigate('/client/payments');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pago Cancelado
          </h1>
          
          <p className="text-lg text-gray-600 mb-4">
            Su pago ha sido cancelado. No se ha realizado ningún cargo.
          </p>

          <p className="text-sm text-gray-500 mb-8">
            Será redirigido automáticamente en {countdown} segundos...
          </p>

          {token && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-700">
                  Su sesión de pago (Token: {token.substring(0, 8)}...) ha sido cancelada.
                  Puede intentar realizar el pago nuevamente cuando esté listo.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Intentar Pago Nuevamente
            </button>
            
            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Regresar
            </button>
            
            <Link
              to="/client/dashboard"
              className="block w-full text-center px-6 py-3 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Ir al Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              ¿Por qué fue cancelado mi pago?
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Hizo clic en "Cancelar" en PayPal</p>
              <p>• Cerró la ventana de pago</p>
              <p>• La sesión expiró por inactividad</p>
              <p>• Problemas de conexión durante el proceso</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
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

export default PaymentCancel;