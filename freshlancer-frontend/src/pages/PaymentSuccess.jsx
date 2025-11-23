import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const payment = searchParams.get('payment');

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      handleContinue();
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleContinue = () => {
    if (user?.role === 'student') {
      navigate('/student/subscription');
    } else if (user?.role === 'client') {
      navigate('/client/packages');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <div className="text-center space-y-6 py-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              {user?.role === 'student'
                ? 'Your premium subscription has been activated successfully.'
                : 'Your points package has been added to your account.'}
            </p>
          </div>

          {/* Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-left">
                <p className="font-medium text-gray-900 mb-1">
                  What happens next?
                </p>
                <ul className="space-y-1 text-gray-600">
                  {user?.role === 'student' ? (
                    <>
                      <li>• Your account has been upgraded to Premium</li>
                      <li>• You can now apply to up to 100 jobs per month</li>
                      <li>• Your profile will get priority in search results</li>
                      <li>• You'll receive a confirmation notification</li>
                    </>
                  ) : (
                    <>
                      <li>• Points have been added to your account</li>
                      <li>• You can now post jobs and manage applications</li>
                      <li>• Your points never expire</li>
                      <li>• You'll receive a confirmation notification</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleContinue}
            >
              {user?.role === 'student' ? 'Go to Subscription' : 'Go to Packages'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting automatically in 5 seconds...
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
