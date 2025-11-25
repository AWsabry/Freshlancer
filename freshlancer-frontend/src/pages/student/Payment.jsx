import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../../services/subscriptionService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { ArrowLeft, Lock, CheckCircle, CreditCard } from 'lucide-react';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get payment details from navigation state
  // Force EGP currency as it's the only supported currency for Paymob
  const { amount } = location.state || {};
  const currency = 'EGP'; // Always use EGP - Paymob only supports EGP

  // Calculate fees and total
  const subtotal = amount || 0;
  const processingFee = subtotal * 0.03; // 3% processing fee
  const total = subtotal + processingFee;

  const upgradeMutation = useMutation({
    mutationFn: (paymentData) => subscriptionService.upgradeToPremium(paymentData),
    onSuccess: async (response) => {
      try {
        console.log('Payment response received:', response);
        console.log('Response data:', response?.data);

        // After decryption, the response is the decrypted object itself
        // Check both response.data.clientSecret and response.data.data.clientSecret for backwards compatibility
        const clientSecret = response?.data?.clientSecret || response?.data?.data?.clientSecret;

        // Check if response contains Paymob client secret (for EGP payments)
        if (clientSecret) {
          const publicKey = 'egy_pk_test_xgfkuiZo2us0viNDmSCVU1OvNnJQOUwv';
          const paymobUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;

          console.log('Client Secret received:', clientSecret);
          console.log('Redirecting to Paymob:', paymobUrl);

          // Add small delay to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 100));

          // Redirect to Paymob payment page
          window.location.href = paymobUrl;
        } else {
          console.warn('No clientSecret in response. Response structure:', response);
          // For non-EGP currencies or fallback
          queryClient.invalidateQueries(['subscription']);
          queryClient.invalidateQueries(['applicationLimit']);
          alert('Payment successful! Your Premium subscription is now active.');
          navigate('/student/subscription');
        }
      } catch (error) {
        console.error('Error processing payment response:', error);
        alert('Payment processing error. Please contact support.');
      }
    },
    onError: (error) => {
      console.error('Payment mutation error:', error);
      console.error('Error response:', error.response);
      alert(error.response?.data?.message || 'Payment failed. Please try again.');
    },
  });

  const handlePayment = () => {
    // Process payment
    const paymentData = {
      amount: total,
      currency: currency,
      billingCycle: 'monthly',
    };
    console.log('Processing payment with data:', paymentData);

    upgradeMutation.mutate(paymentData);
  };

  // Redirect back if no payment details
  if (!amount) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No payment details found</p>
            <Button onClick={() => navigate('/student/subscription')}>
              Go to Subscription
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/student/subscription')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Subscription
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Information */}
        <div className="lg:col-span-2">
          <Card title="Complete Payment">
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="p-3 bg-blue-100 rounded-full">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Secure Payment with Paymob
                  </h3>
                  <p className="text-sm text-gray-600">
                    You will be redirected to Paymob to securely complete your payment.
                    Paymob accepts credit/debit cards, mobile wallets, and other payment methods.
                  </p>
                </div>
              </div>

              {/* Payment Methods Info */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Accepted Payment Methods:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">💳 Credit/Debit Cards</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, Meeza</p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">📱 Mobile Wallets</p>
                    <p className="text-xs text-gray-500">Vodafone, Etisalat, Orange</p>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Your payment is secure
                    </p>
                    <p className="text-xs text-gray-600">
                      All transactions are encrypted and processed securely through Paymob's
                      payment gateway. Your card details are never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <Card title="Payment Summary">
            <div className="space-y-4">
              {/* Plan Details */}
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Plan</p>
                  <Badge variant="success">Premium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Billing Cycle</p>
                  <p className="text-sm font-medium text-gray-900">Monthly</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-sm font-medium text-gray-900">
                    {currency} {subtotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Processing Fee</p>
                  <p className="text-sm font-medium text-gray-900">
                    {currency} {processingFee.toFixed(2)}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-gray-900">Total</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {currency} {total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">What you'll get:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">100 job applications/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Priority in search results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Featured profile badge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Priority support</span>
                  </li>
                </ul>
              </div>

              {/* Pay Button */}
              <Button
                variant="primary"
                className="w-full mt-6"
                onClick={handlePayment}
                loading={upgradeMutation.isPending}
              >
                <Lock className="w-5 h-5 mr-2" />
                Proceed to Payment
              </Button>

              {/* Security Note */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                <Lock className="w-3 h-3" />
                <p>Secure payment powered by Paymob</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
