import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../../services/subscriptionService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { CheckCircle, Star, Zap, CreditCard } from 'lucide-react';

const Subscription = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMySubscription(),
  });

  // Fetch pricing based on user's currency
  const { data: pricingData, isLoading: pricingLoading } = useQuery({
    queryKey: ['subscriptionPricing'],
    queryFn: () => subscriptionService.getPricing(),
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

  if (isLoading || pricingLoading) {
    return <Loading text="Loading subscription..." />;
  }

  const subscription = data?.data?.subscription;
  const isPremium = subscription?.plan === 'premium';
  const applicationsUsed = subscription?.applicationsUsedThisMonth || 0;
  const applicationsLimit = subscription?.applicationLimitPerMonth || 10;
  const applicationsRemaining = applicationsLimit - applicationsUsed;

  // Get pricing data
  const pricing = pricingData?.data?.data;
  const currency = pricing?.currency || 'USD';
  const monthlyPrice = pricing?.plans?.premium?.billingCycles?.monthly?.price?.amount || 9.99;
  const quarterlyPrice = pricing?.plans?.premium?.billingCycles?.quarterly?.price?.amount || 24.99;
  const yearlyPrice = pricing?.plans?.premium?.billingCycles?.yearly?.price?.amount || 79.99;
  const quarterlySavings = pricing?.plans?.premium?.billingCycles?.quarterly?.savings || 0;
  const yearlySavings = pricing?.plans?.premium?.billingCycles?.yearly?.savings || 0;

  const handleUpgrade = () => {
    // In production, integrate with payment gateway (Stripe/PayPal)
    const confirmed = confirm(`Upgrade to Premium for ${currency} ${monthlyPrice.toFixed(2)}/month?`);
    if (confirmed) {
      upgradeMutation.mutate({
        paymentMethod: 'stripe', // Placeholder
        amount: monthlyPrice,
        currency,
      });
    }
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

      {/* Usage Stats */}
      <Card title="Usage This Month">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Applications Used</span>
              <span className="text-sm text-gray-600">
                {applicationsUsed} / {isPremium ? '∞' : applicationsLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  applicationsRemaining < 3 ? 'bg-red-500' : 'bg-primary-500'
                }`}
                style={{
                  width: isPremium ? '50%' : `${(applicationsUsed / applicationsLimit) * 100}%`,
                }}
              />
            </div>
          </div>

          {!isPremium && applicationsRemaining < 3 && (
            <Alert
              type="warning"
              message={`You have only ${applicationsRemaining} application${applicationsRemaining !== 1 ? 's' : ''} remaining. Upgrade to Premium for 100 applications per month!`}
            />
          )}
          {isPremium && applicationsRemaining < 10 && (
            <Alert
              type="warning"
              message={`You have only ${applicationsRemaining} application${applicationsRemaining !== 1 ? 's' : ''} remaining this month.`}
            />
          )}
        </div>
      </Card>

      {/* Pricing Plans */}
      {!isPremium && (
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
              {currency} {monthlyPrice.toFixed(2)}<span className="text-lg text-gray-500">/month</span>
            </p>
            {quarterlySavings > 0 && (
              <p className="text-sm text-green-600 mb-2">
                Save {currency} {quarterlySavings.toFixed(2)} with quarterly plan ({currency} {quarterlyPrice.toFixed(2)}/3 months)
              </p>
            )}
            {yearlySavings > 0 && (
              <p className="text-sm text-green-600 mb-2">
                Save {currency} {yearlySavings.toFixed(2)} with yearly plan ({currency} {yearlyPrice.toFixed(2)}/year)
              </p>
            )}
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
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Advanced analytics</span>
              </li>
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
