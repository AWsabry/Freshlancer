import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import { authService } from '../../services/authService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { CheckCircle, Star, Zap, CreditCard } from 'lucide-react';

const Subscription = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState('EGP');

  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMySubscription(),
  });

  // Fetch current user data (including application counts)
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getMe(),
  });

  // Fetch pricing based on selected currency
  const { data: pricingData, isLoading: pricingLoading } = useQuery({
    queryKey: ['subscriptionPricing', selectedCurrency],
    queryFn: () => subscriptionService.getPricing(selectedCurrency),
  });

  const upgradeMutation = useMutation({
    mutationFn: (paymentData) => subscriptionService.upgradeToPremium(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription']);
      alert('Successfully upgraded to Premium!');
    },
    onError: (error) => {
      alert(error.message || 'Upgrade failed');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason) => subscriptionService.cancelSubscription(reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription']);
      alert('Subscription cancelled successfully');
    },
  });

  if (isLoading || pricingLoading || loadingUser) {
    return <Loading text="Loading subscription..." />;
  }

  const subscription = data?.data?.subscription;
  const isPremium = subscription?.plan === 'premium';

  // Get application data from user profile
  const studentProfile = userData?.data?.user?.studentProfile;
  const applicationsUsed = studentProfile?.applicationsUsedThisMonth || 0;
  const subscriptionTier = studentProfile?.subscriptionTier || 'free';
  const applicationsLimit = subscriptionTier === 'premium' ? 100 : 10;
  const applicationsRemaining = applicationsLimit - applicationsUsed;

  // Get pricing data
  const pricing = pricingData?.data;
  const currency = pricing?.currency || selectedCurrency;
  const monthlyPrice = pricing?.plans?.premium?.billingCycles?.monthly?.price?.amount || 9.99;

  const handleUpgrade = () => {
    // Navigate to payment page with currency and amount
    navigate('/student/payment', {
      state: {
        currency: selectedCurrency,
        amount: monthlyPrice,
      },
    });
  };

  const handleCancel = () => {
    const reason = prompt('Please tell us why you want to cancel (optional):');
    if (reason !== null) {
      cancelMutation.mutate(reason || 'No reason provided');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Current Plan */}
      <Card title="Current Subscription">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold">
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </h3>
              <Badge variant={isPremium ? 'success' : 'info'}>
                {isPremium ? 'Active' : 'Free Tier'}
              </Badge>
            </div>
            <p className="text-gray-600">
              {isPremium
                ? `${applicationsRemaining} of ${applicationsLimit} applications remaining this month`
                : `${applicationsRemaining} of ${applicationsLimit} applications remaining this month`}
            </p>
            {subscription?.nextBillingDate && (
              <p className="text-sm text-gray-500 mt-2">
                Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
              </p>
            )}
          </div>
          {isPremium ? (
            <Star className="w-16 h-16 text-yellow-500" />
          ) : (
            <Zap className="w-16 h-16 text-gray-400" />
          )}
        </div>
      </Card>



      {/* Pricing Plans */}
      {!isPremium && (
        <>
          {/* Currency Selection */}
          <Card title="Select Currency">
            <div className="flex justify-center">
              <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
                <button
                  disabled
                  className="px-6 py-2 rounded-md font-medium transition-all border text-gray-400 border-transparent cursor-not-allowed opacity-60"
                  title="USD payments not yet available"
                >
                  USD ($)
                  <span className="text-xs block">Coming soon</span>
                </button>
                <button
                  onClick={() => setSelectedCurrency('EGP')}
                  className={`px-6 py-2 rounded-md font-medium transition-all border ${
                    selectedCurrency === 'EGP'
                      ? 'bg-primary-500 text-[#8904aa] border-primary-500 shadow-md'
                      : 'text-gray-700 border-transparent hover:bg-gray-100'
                  }`}
                >
                  EGP (E£)
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mt-3">
              Currently, we only accept payments in Egyptian Pounds (EGP) through Paymob.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="relative">
            <div className="absolute top-4 right-4">
              <Badge variant="info">Current Plan</Badge>
            </div>
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-4xl font-bold mb-4">
              $0<span className="text-lg text-gray-500">/month</span>
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">10 job applications per month</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Access to all job listings</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Basic profile visibility</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Email support</span>
              </li>
            </ul>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-primary-500 shadow-lg">
            <div className="absolute top-4 right-4">
              <Badge variant="success">Recommended</Badge>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-primary-600">Premium</h3>
            <p className="text-4xl font-bold mb-4">
              {currency} {monthlyPrice.toFixed(2)}
              <span className="text-lg text-gray-500">/month</span>
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-semibold">100 job applications per month</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Priority in search results</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Featured profile badge</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Priority customer support</span>
              </li>
              {/* <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Advanced analytics</span>
              </li> */}
            </ul>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleUpgrade}
              loading={upgradeMutation.isPending}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
          </Card>
        </div>
        </>
      )}

      {/* Cancel Subscription */}
      {isPremium && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Cancel Subscription</h3>
              <p className="text-sm text-gray-600">
                You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleCancel}
              loading={cancelMutation.isPending}
            >
              Cancel Plan
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Subscription;
