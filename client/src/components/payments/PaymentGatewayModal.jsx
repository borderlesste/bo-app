import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  XCircle, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Shield,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

const PaymentGatewayModal = ({ order, onClose, onPayment }) => {
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('select'); // select, processing, success, error
  const [paymentData, setPaymentData] = useState({
    bankInfo: '',
    cardData: {
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    }
  });
  const [paymentError, setPaymentError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  
  const { user } = useAuth();
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  // Validate payment data
  const validatePayment = () => {
    if (paymentMethod === 'transferencia') {
      if (!paymentData.bankInfo.trim()) {
        setPaymentError('Por favor ingresa el banco de origen');
        return false;
      }
    } else if (paymentMethod === 'tarjeta') {
      const { number, expiry, cvv, name } = paymentData.cardData;
      if (!number || number.replace(/\s/g, '').length < 13) {
        setPaymentError('Número de tarjeta inválido');
        return false;
      }
      if (!expiry || expiry.length < 5) {
        setPaymentError('Fecha de vencimiento inválida');
        return false;
      }
      if (!cvv || cvv.length < 3) {
        setPaymentError('CVV inválido');
        return false;
      }
      if (!name.trim()) {
        setPaymentError('Nombre del titular requerido');
        return false;
      }
    }
    return true;
  };

  // Handle PayPal payment
  const processPayPalPayment = async (paymentRequestData) => {
    try {
      // First create the payment record
      const response = await fetch('/api/client-payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...paymentRequestData,
          metodo_pago: 'PayPal'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al procesar el pago');
      }

      // Create PayPal order
      const paypalResponse = await fetch('/api/payment-gateway/paypal/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentRequestData.monto,
          currency: 'USD',
          orderData: {
            service: order.servicio || 'Desarrollo de Software',
            reference_id: `order_${order.id}`,
            payment_id: result.data?.id
          }
        })
      });

      const paypalResult = await paypalResponse.json();

      if (paypalResult.success && paypalResult.data?.approve_url) {
        // Redirect to PayPal
        if (paypalResult.data.approve_url) {
          window.open(paypalResult.data.approve_url, '_blank');
          setStep('processing');
          showWarning('Complete el pago en PayPal. Esta ventana se cerrará automáticamente cuando se confirme el pago.');
          
          // Poll for payment confirmation
          pollPaymentStatus(result.data?.id);
        }
      } else {
        throw new Error(paypalResult.message || 'Error al crear orden de PayPal');
      }

    } catch (error) {
      console.error('PayPal payment error:', error);
      throw error;
    }
  };

  // Handle card payment
  const processCardPayment = async (paymentRequestData) => {
    try {
      // Create Stripe payment intent
      const response = await fetch('/api/payment-gateway/stripe/create-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentRequestData.monto,
          currency: 'usd',
          metadata: {
            order_id: order.id,
            user_id: user.id,
            payment_method: 'Tarjeta de Crédito'
          }
        })
      });

      const stripeResult = await response.json();

      if (stripeResult.success) {
        // Create payment record with Stripe details
        const paymentResponse = await fetch('/api/client-payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...paymentRequestData,
            metodo_pago: 'Tarjeta de Crédito',
            referencia_transferencia: stripeResult.data?.payment_intent_id,
            estado: 'aplicado' // Card payments are processed immediately
          })
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentResult.message || 'Error al procesar el pago');
        }

        // For immediate processing, confirm the Stripe payment
        try {
          await fetch('/api/payment-gateway/stripe/confirm-payment', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              paymentIntentId: stripeResult.data?.payment_intent_id,
              paymentID: paymentResult.data?.id
            })
          });
        } catch (confirmError) {
          console.warn('Payment confirmation error (payment still processed):', confirmError);
        }

        return paymentResult;
      } else {
        throw new Error(stripeResult.message || 'Error al procesar tarjeta');
      }
    } catch (error) {
      console.error('Card payment error:', error);
      throw error;
    }
  };

  // Handle bank transfer
  const processBankTransfer = async (paymentRequestData) => {
    try {
      const response = await fetch('/api/client-payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...paymentRequestData,
          metodo_pago: 'Transferencia Bancaria',
          referencia_transferencia: paymentData.bankInfo
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al procesar el pago');
      }

      return result;
    } catch (error) {
      console.error('Bank transfer error:', error);
      throw error;
    }
  };

  // Poll payment status for PayPal
  const pollPaymentStatus = (paymentId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment-gateway/${paymentId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const result = await response.json();
        
        if (result.success && result.data?.estado === 'aplicado') {
          clearInterval(interval);
          setStep('success');
          setPaymentResult(result.data);
          showSuccess('¡Pago confirmado exitosamente!');
          setTimeout(() => {
            onPayment(result.data);
          }, 2000);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (step === 'processing') {
        setStep('error');
        setPaymentError('Tiempo de espera agotado. Por favor verifique su pago.');
      }
    }, 300000);
  };

  // Main payment handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePayment()) {
      return;
    }

    setProcessing(true);
    setPaymentError(null);
    setStep('processing');

    const paymentRequestData = {
      order_id: order.id,
      concepto: `Pago del proyecto #${order.numero_pedido || order.id}`,
      monto: parseFloat(order.value)
    };

    try {
      let result;

      switch (paymentMethod) {
        case 'paypal':
          await processPayPalPayment(paymentRequestData);
          return; // PayPal handles its own flow
          
        case 'tarjeta':
          result = await processCardPayment(paymentRequestData);
          break;
          
        case 'transferencia':
          result = await processBankTransfer(paymentRequestData);
          break;
          
        default:
          throw new Error('Método de pago no válido');
      }

      setStep('success');
      setPaymentResult(result.data);
      showSuccess('¡Pago procesado exitosamente!');
      
      setTimeout(() => {
        onPayment(result.data);
      }, 2000);

    } catch (error) {
      console.error('Payment processing error:', error);
      setStep('error');
      setPaymentError(error.message);
      showError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Render different steps
  const renderContent = () => {
    switch (step) {
      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Procesando pago...
            </h3>
            <p className="text-sm text-gray-500">
              {paymentMethod === 'paypal' 
                ? 'Complete el pago en PayPal para continuar'
                : paymentMethod === 'tarjeta'
                ? 'Verificando datos de la tarjeta...'
                : 'Registrando transferencia bancaria...'
              }
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ¡Pago exitoso!
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Su pago ha sido procesado correctamente
            </p>
            {paymentResult && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">
                  ID de transacción: {paymentResult.numero_pago}
                </p>
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error en el pago
            </h3>
            <p className="text-sm text-red-600 mb-4">
              {paymentError}
            </p>
            <button
              onClick={() => setStep('select')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar nuevamente
            </button>
          </div>
        );

      default:
        return renderPaymentForm();
    }
  };

  const renderPaymentForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900">Proyecto #{order.numero_pedido || order.id}</h4>
        <p className="text-sm text-gray-600">{order.descripcion}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">Total a pagar:</span>
          <span className="text-xl font-bold text-blue-600">
            ${parseFloat(order.value).toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Método de Pago
        </label>
        <div className="space-y-3">
          {/* PayPal */}
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">PayPal</span>
                <Shield className="h-4 w-4 text-blue-600 ml-2" />
              </div>
              <p className="text-xs text-gray-500">Pago instantáneo y seguro</p>
            </div>
          </label>

          {/* Credit/Debit Card */}
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="tarjeta"
              checked={paymentMethod === 'tarjeta'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">Tarjeta de Crédito/Débito</span>
                <CreditCard className="h-4 w-4 text-green-600 ml-2" />
              </div>
              <p className="text-xs text-gray-500">Visa, MasterCard, American Express</p>
            </div>
          </label>

          {/* Bank Transfer */}
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="transferencia"
              checked={paymentMethod === 'transferencia'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">Transferencia Bancaria</span>
                <Clock className="h-4 w-4 text-yellow-600 ml-2" />
              </div>
              <p className="text-xs text-gray-500">Verificación manual requerida</p>
            </div>
          </label>
        </div>
      </div>

      {/* Card Details */}
      {paymentMethod === 'tarjeta' && (
        <div className="space-y-4 border-t pt-4">
          <h5 className="font-medium text-gray-900">Datos de la Tarjeta</h5>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Tarjeta
            </label>
            <input
              type="text"
              value={paymentData.cardData.number}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                cardData: { ...prev.cardData, number: formatCardNumber(e.target.value) }
              }))}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimiento
              </label>
              <input
                type="text"
                value={paymentData.cardData.expiry}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  cardData: { ...prev.cardData, expiry: formatExpiry(e.target.value) }
                }))}
                placeholder="MM/YY"
                maxLength="5"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                value={paymentData.cardData.cvv}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  cardData: { ...prev.cardData, cvv: e.target.value.replace(/\D/g, '') }
                }))}
                placeholder="123"
                maxLength="4"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Titular
            </label>
            <input
              type="text"
              value={paymentData.cardData.name}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                cardData: { ...prev.cardData, name: e.target.value.toUpperCase() }
              }))}
              placeholder="NOMBRE APELLIDO"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
        </div>
      )}

      {/* Bank Transfer Details */}
      {paymentMethod === 'transferencia' && (
        <div className="space-y-4 border-t pt-4">
          <h5 className="font-medium text-gray-900">Información de Transferencia</h5>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco de Origen
            </label>
            <input
              type="text"
              value={paymentData.bankInfo}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                bankInfo: e.target.value
              }))}
              placeholder="Ej: Banco Nacional"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Datos para transferencia:</strong><br />
              Banco: Banco Nacional<br />
              Cuenta: 1234567890<br />
              CLABE: 012345678901234567<br />
              Beneficiario: Borderless Techno
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{paymentError}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="flex items-center">
          <Shield className="h-4 w-4 text-green-600 mr-2" />
          <p className="text-sm text-green-700">
            {paymentMethod === 'paypal' 
              ? '✅ Su proyecto se completará automáticamente al confirmar el pago'
              : paymentMethod === 'tarjeta'
              ? '✅ Procesamiento seguro con encriptación SSL'
              : '⏳ Su pago será verificado y el proyecto se completará tras la confirmación'
            }
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition-colors"
          disabled={processing}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={processing}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Procesando...
            </>
          ) : (
            `Pagar $${parseFloat(order.value).toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">
              Realizar Pago Seguro
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={processing}
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;