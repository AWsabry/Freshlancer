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

  const handlePurchase = (packageType, price) => {
    const confirmed = confirm(`Purchase ${packageType} package for $${price}?`);
    if (confirmed) {
      // In production, integrate with payment gateway
      purchaseMutation.mutate({
        packageType,
        paymentData: {
          paymentMethod: 'stripe',
          amount: price,
        },
      });
    }
  };

  if (isLoading) {
    return <Loading text="Loading packages..." />;
  }

  const packages = [
    {
      name: 'Basic',
      type: 'basic',
      price: 29.99,
      points: 50,
      profileViews: 3,
      icon: Eye,
      color: 'blue',
      features: [
        '50 points total',
        'View up to 3 profiles per job',
        'Valid for 30 days',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      type: 'professional',
      price: 79.99,
      points: 150,
      profileViews: 10,
      icon: Zap,
      color: 'primary',
      popular: true,
      features: [
        '150 points total',
        'View up to 10 profiles per job',
        'Valid for 30 days',
        'Priority support',
        'Advanced search filters',
      ],
    },
    {
      name: 'Enterprise',
      type: 'enterprise',
      price: 249.99,
      points: 500,
      profileViews: 50,
      icon: TrendingUp,
      color: 'purple',
      features: [
        '500 points total',
        'View up to 50 profiles per job',
        'Valid for 30 days',
        'Dedicated account manager',
        'Advanced analytics',
        'Priority job listing',
      ],
    },
  ];

  const active = activePackage?.data?.package;
  const balance = pointsBalance?.data;

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      {active && (
        <Card title="Current Package">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Available Points</p>
              <p className="text-3xl font-bold text-primary-600">
                {balance?.pointsRemaining || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Profiles Unlocked</p>
              <p className="text-3xl font-bold text-green-600">
                {active.profilesUnlocked || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
              <p className="text-lg font-bold text-blue-600">
                {new Date(active.expiryDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          {balance?.pointsRemaining < 20 && (
            <Alert
              type="warning"
              message="You're running low on points. Purchase a new package to continue unlocking profiles."
              className="mt-4"
            />
          )}
        </Card>
      )}

      {/* Package Info */}
      <Alert
        type="info"
        title="How Points Work"
        message="Each student profile unlock costs 10 points. Purchase a package to get points and start viewing full student profiles."
      />

      {/* Available Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <Card
              key={pkg.type}
              className={`relative ${
                pkg.popular ? 'border-2 border-primary-500 shadow-lg' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 m-4">
                  <Badge variant="success">
                    <Star className="w-4 h-4 mr-1 inline" />
                    Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex p-4 rounded-full bg-${pkg.color}-100 mb-4`}>
                  <Icon className={`w-8 h-8 text-${pkg.color}-600`} />
                </div>
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">${pkg.price}</span>
                  <span className="text-gray-500">/package</span>
                </div>
                <p className="text-gray-600">
                  {pkg.points} points • {pkg.profileViews} views/job
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={pkg.popular ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => handlePurchase(pkg.type, pkg.price)}
                loading={purchaseMutation.isPending}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Purchase Package
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Package History */}
      {myPackages?.data?.packages?.length > 0 && (
        <Card title="Purchase History">
          <div className="space-y-4">
            {myPackages.data.packages.map((pkg) => (
              <div
                key={pkg._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {pkg.packageType} Package
                    </h4>
                    <Badge
                      variant={
                        pkg.status === 'active' ? 'success' :
                        pkg.status === 'expired' ? 'error' :
                        pkg.status === 'exhausted' ? 'warning' : 'info'
                      }
                    >
                      {pkg.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                    <div>
                      Points: {pkg.pointsUsed}/{pkg.pointsTotal}
                    </div>
                    <div>Profiles: {pkg.profilesUnlocked || 0}</div>
                    <div>
                      Expires: {new Date(pkg.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${pkg.price?.amount || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(pkg.createdAt).toLocaleDateString()}
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
