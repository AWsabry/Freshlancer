import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { Eye, Zap, TrendingUp, CheckCircle, CreditCard } from 'lucide-react';

const Packages = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Fetch active package and points balance
  const { data: activePackage } = useQuery({
    queryKey: ['activePackage'],
    queryFn: () => packageService.getActivePackage(),
  });

  const { data: pointsBalance, isLoading } = useQuery({
    queryKey: ['pointsBalance'],
    queryFn: () => packageService.getPointsBalance(),
  });

  const balance = pointsBalance?.data?.data;
  const currentPoints = balance?.pointsRemaining || 0;

  // Points packages with USD and EGP pricing
  const getPackagesForCurrency = (currency) => {
    const rates = {
      USD: 1,
      EGP: 49.5, // Conversion rate
    };

    const basePackages = [
      {
        name: '500 Points',
        type: 'basic',
        basePrice: 9.99,
        points: 500,
        icon: Eye,
        color: 'blue',
        description: 'Perfect for small projects',
        features: [
          '50 student profile unlocks',
          'Valid lifetime',
          // 'Email support',
        ],
      },
      {
        name: '1000 Points',
        type: 'professional',
        basePrice: 14.99,
        points: 1000,
        icon: Zap,
        color: 'primary',
        popular: true,
        description: 'Most popular choice',
        features: [
          '100 student profile unlocks',
          'Valid lifetime',
          // 'Priority email support',
        ],
      },
      {
        name: '2000 Points',
        type: 'enterprise',
        basePrice: 21.99,
        points: 2000,
        icon: TrendingUp,
        color: 'purple',
        description: 'For large Access',
        // savings: '17% savings',
        features: [
          '200 student profile unlocks',
          'Valid lifetime',
          // 'Priority support',
          // '17% cost savings',
          // 'Dedicated account manager',
        ],
      },
    ];

    return basePackages.map((pkg) => ({
      ...pkg,
      price: Math.round(pkg.basePrice * rates[currency] * 100) / 100,
      currency,
    }));
  };

  const packages = getPackagesForCurrency(selectedCurrency);

  const handlePurchase = (packageData) => {
    navigate('/client/payment', {
      state: {
        currency: selectedCurrency,
        amount: packageData.price,
        packageType: packageData.type,
        packageName: packageData.name,
        points: packageData.points,
      },
    });
  };

  if (isLoading) {
    return <Loading text="Loading packages..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Current Balance */}
      <Card title="Points Balance">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Available Points</p>
            <p className="text-4xl font-bold text-primary-600">{currentPoints}</p>
            <p className="text-sm text-gray-500 mt-2">
              Each point unlocks one student profile (10 points per unlock)
            </p>
          </div>
          <div className="text-right">
            <CreditCard className="w-16 h-16 text-gray-400" />
          </div>
        </div>
      </Card>

      {/* Currency Selection */}
      <Card title="Select Currency">
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
            <button
              onClick={() => setSelectedCurrency('USD')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                selectedCurrency === 'USD'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setSelectedCurrency('EGP')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                selectedCurrency === 'EGP'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              EGP (E£)
            </button>
          </div>
        </div>
      </Card>

      {/* Points Packages */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Buy Points Packages</h2>
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
                  <div className="absolute top-4 right-4">
                    <Badge variant="success">Most Popular</Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div
                    className={`inline-flex p-4 rounded-full mb-4 ${
                      pkg.color === 'blue'
                        ? 'bg-blue-100'
                        : pkg.color === 'primary'
                        ? 'bg-primary-100'
                        : 'bg-purple-100'
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 ${
                        pkg.color === 'blue'
                          ? 'text-blue-600'
                          : pkg.color === 'primary'
                          ? 'text-primary-600'
                          : 'text-purple-600'
                      }`}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                  {pkg.savings && (
                    <Badge variant="success" className="mb-4">
                      {pkg.savings}
                    </Badge>
                  )}
                  <p className="text-4xl font-bold text-gray-900">
                    {pkg.currency} {pkg.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {pkg.currency} {(pkg.price / pkg.points).toFixed(2)} per point
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={pkg.popular ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => handlePurchase(pkg)}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Buy Package
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* How it Works */}
      <Card title="How Points Work">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-primary-100 mb-4">
              <span className="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Buy Points</h3>
            <p className="text-sm text-gray-600">
              Choose a package that fits your needs and purchase points
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-primary-100 mb-4">
              <span className="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Unlock Profiles</h3>
            <p className="text-sm text-gray-600">
              Use 10 points to unlock each student's full profile and contact information
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-primary-100 mb-4">
              <span className="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Connect & Hire</h3>
            <p className="text-sm text-gray-600">
              Contact talented students directly and build your team
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Packages;
