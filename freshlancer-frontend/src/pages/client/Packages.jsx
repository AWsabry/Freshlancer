import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageService } from '../../services/packageService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { CreditCard, Eye, Zap, TrendingUp, CheckCircle, Star } from 'lucide-react';

const Packages = () => {
  const queryClient = useQueryClient();

  // Fetch available packages
  const { data: availablePackages } = useQuery({
    queryKey: ['availablePackages'],
    queryFn: () => packageService.getAvailablePackages(),
  });

  // Fetch my packages
  const { data: myPackages, isLoading } = useQuery({
    queryKey: ['myPackages'],
    queryFn: () => packageService.getMyPackages(),
  });

  // Fetch active package and points balance
  const { data: activePackage } = useQuery({
    queryKey: ['activePackage'],
    queryFn: () => packageService.getActivePackage(),
  });

  const { data: pointsBalance } = useQuery({
    queryKey: ['pointsBalance'],
    queryFn: () => packageService.getPointsBalance(),
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: ({ packageType, paymentData }) =>
      packageService.purchasePackage(packageType, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPackages']);
      queryClient.invalidateQueries(['activePackage']);
      queryClient.invalidateQueries(['pointsBalance']);
      alert('Package purchased successfully!');
    },
    onError: (error) => {
      alert(error.message || 'Purchase failed');
    },
  });

  const handlePurchase = (packageType, price, points) => {
    const newBalance = (balance?.pointsRemaining || 0) + points;
    const confirmed = confirm(
      `Buy ${points} points for $${price}?\n\nYour balance will be: ${newBalance} points`
    );
    if (confirmed) {
      // For development: Payment is automatically completed by backend
      purchaseMutation.mutate({
        packageType,
        paymentData: {
          paymentMethod: 'credit_card',
          amount: price,
        },
      });
    }
  };

  if (isLoading) {
    return <Loading text="Loading packages..." />;
  }

  const pointsPackages = [
    {
      name: '50 Points',
      type: 'basic',
      price: 29.99,
      points: 50,
      icon: Eye,
      color: 'blue',
      description: 'Perfect for small projects',
      pricePerPoint: '0.60',
    },
    {
      name: '150 Points',
      type: 'professional',
      price: 79.99,
      points: 150,
      icon: Zap,
      color: 'primary',
      popular: true,
      description: 'Most popular choice',
      pricePerPoint: '0.53',
      savings: '12% savings',
    },
    {
      name: '500 Points',
      type: 'enterprise',
      price: 249.99,
      points: 500,
      icon: TrendingUp,
      color: 'purple',
      description: 'Best value for large teams',
      pricePerPoint: '0.50',
      savings: '17% savings',
    },
  ];

  const active = activePackage?.data?.package;
  const balance = pointsBalance?.data;

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
            <p className="text-sm text-primary-600 font-medium mb-2">Available Points</p>
            <p className="text-5xl font-bold text-primary-700">
              {balance?.pointsRemaining || 0}
            </p>
            <p className="text-xs text-primary-600 mt-2">Never expire</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium mb-2">Profiles Unlocked</p>
            <p className="text-5xl font-bold text-green-700">
              {active?.profilesUnlocked || 0}
            </p>
            <p className="text-xs text-green-600 mt-2">All time</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium mb-2">Points Used</p>
            <p className="text-5xl font-bold text-blue-700">
              {balance?.pointsUsed || 0}
            </p>
            <p className="text-xs text-blue-600 mt-2">Total spent</p>
          </div>
        </div>
        {balance?.pointsRemaining < 20 && (
          <Alert
            type="warning"
            message="You're running low on points. Purchase more points below to continue unlocking student profiles."
            className="mt-4"
          />
        )}
      </Card>

      {/* How Points Work */}
      <Alert
        type="info"
        title="How Points Work"
        message="Each student profile unlock costs 10 points. Points never expire and accumulate in your account. Buy more points anytime to keep unlocking student profiles. (Payment is automatically processed for development)"
      />

      {/* Points Packages */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Buy Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pointsPackages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <Card
                key={pkg.type}
                className={`relative ${
                  pkg.popular ? 'border-2 border-primary-500 shadow-lg transform scale-105' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="success" className="px-4 py-1">
                      <Star className="w-4 h-4 mr-1 inline" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6 mt-2">
                  <div className={`inline-flex p-4 rounded-full bg-${pkg.color}-100 mb-4`}>
                    <Icon className={`w-8 h-8 text-${pkg.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">${pkg.price}</span>
                  </div>
                  <p className="text-primary-600 font-medium text-lg mb-1">
                    {pkg.points} Points
                  </p>
                  <p className="text-gray-500 text-sm">${pkg.pricePerPoint} per point</p>
                  {pkg.savings && (
                    <Badge variant="success" className="mt-2">
                      {pkg.savings}
                    </Badge>
                  )}
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-center text-gray-700">{pkg.description}</p>
                  <div className="mt-3 text-center text-sm text-gray-600">
                    <p>✓ Unlock up to {pkg.points / 10} student profiles</p>
                    <p>✓ Points never expire</p>
                    <p>✓ Add to existing balance</p>
                  </div>
                </div>

                <Button
                  variant={pkg.popular ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => handlePurchase(pkg.type, pkg.price, pkg.points)}
                  loading={purchaseMutation.isPending}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Buy {pkg.points} Points
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Purchase History */}
      {myPackages?.data?.packages?.length > 0 && (
        <Card title="Purchase History">
          <div className="space-y-3">
            {myPackages.data.packages.map((pkg) => (
              <div
                key={pkg._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    <h4 className="font-bold text-gray-900">
                      {pkg.pointsTotal} Points
                    </h4>
                    <Badge variant="success">
                      Purchased
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(pkg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      Added to balance
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ${pkg.price?.amount || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pkg.pointsTotal} points
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Packages;
