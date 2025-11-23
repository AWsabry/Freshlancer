import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'missing_id':
        return 'Payment verification failed - missing transaction ID.';
      case 'transaction_not_found':
        return 'Transaction not found in our system.';
      case 'payment_not_completed':
        return 'Payment was not completed successfully.';
      case 'processing_error':
        return 'An error occurred while processing your payment.';
      default:
        return 'Payment could not be completed. Please try again.';
    }
  };

  const handleTryAgain = () => {
    if (user?.role === 'student') {
      navigate('/student/subscription');
    } else if (user?.role === 'client') {
      navigate('/client/packages');
    } else {
      navigate('/');
    }
  };

  const handleContactSupport = () => {
    // You can implement support contact functionality here
    window.location.href = 'mailto:support@freshlancer.com?subject=Payment Issue';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <div className="text-center space-y-6 py-8">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Failed
            </h1>
            <p className="text-gray-600">
              {getErrorMessage()}
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-left space-y-2">
              <p className="font-medium text-gray-900">
                Common reasons for payment failure:
              </p>
              <ul className="space-y-1 text-gray-600">
                <li>• Insufficient funds in your account</li>
                <li>• Incorrect card details</li>
                <li>• Card declined by your bank</li>
                <li>• Network connection issues</li>
                <li>• Payment canceled by user</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleTryAgain}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleContactSupport}
            >
              Contact Support
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Support Info */}
          {error && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Error Code: {error}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Please include this code if contacting support
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentFailed;
