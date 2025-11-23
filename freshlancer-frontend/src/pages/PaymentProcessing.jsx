import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Card from '../components/common/Card';
import paymobService from '../services/paymobService';

const PaymentProcessing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intentionId = searchParams.get('id');

  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!intentionId) {
      navigate('/payment/failed?error=missing_id');
      return;
    }

    const checkStatus = async () => {
      try {
        console.log('Checking payment status for intention:', intentionId);

        const response = await paymobService.checkPaymentStatus(intentionId);

        console.log('Payment status response:', response);

        if (response.status === 'success' && response.data) {
          setPaymentData(response.data);

          if (response.data.isPaid) {
            console.log('Payment is completed, redirecting to success page...');
            setStatus('success');

            // Wait 2 seconds before redirecting to show success message
            setTimeout(() => {
              if (response.data.type === 'subscription_payment') {
                navigate('/student/subscription?payment=success');
              } else if (response.data.type === 'package_purchase') {
                navigate('/client/packages?payment=success');
              } else {
                navigate('/payment/success');
              }
            }, 2000);
          } else {
            console.log('Payment not completed, redirecting to failed page...');
            setStatus('failed');

            setTimeout(() => {
              navigate('/payment/failed?error=payment_not_completed');
            }, 2000);
          }
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        setError(err.response?.data?.message || err.message || 'Failed to check payment status');
        setStatus('failed');

        setTimeout(() => {
          navigate('/payment/failed?error=processing_error');
        }, 2000);
      }
    };

    checkStatus();
  }, [intentionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <div className="text-center space-y-6 py-8">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'checking' && (
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            )}
            {status === 'failed' && (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="space-y-2">
            {status === 'checking' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900">
                  Processing Payment
                </h1>
                <p className="text-gray-600">
                  Please wait while we verify your payment...
                </p>
              </>
            )}
            {status === 'success' && (
              <>
                <h1 className="text-2xl font-bold text-green-600">
                  Payment Successful!
                </h1>
                <p className="text-gray-600">
                  Your payment has been confirmed. Redirecting...
                </p>
                {paymentData && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg text-left">
                    <p className="text-sm text-gray-700">
                      <strong>Amount:</strong> {paymentData.currency} {paymentData.amount}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Status:</strong> Completed
                    </p>
                  </div>
                )}
              </>
            )}
            {status === 'failed' && (
              <>
                <h1 className="text-2xl font-bold text-red-600">
                  Payment Failed
                </h1>
                <p className="text-gray-600">
                  {error || 'Your payment could not be completed.'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Redirecting...
                </p>
              </>
            )}
          </div>

          {/* Loading Indicator */}
          {status === 'checking' && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentProcessing;
