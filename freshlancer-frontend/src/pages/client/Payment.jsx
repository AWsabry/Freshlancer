import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { packageService } from '../../services/packageService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { CreditCard, Wallet, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import visaLogo from '../../assets/logos/visa_masterCardLogo.png';
import meezaLogo from '../../assets/logos/Meeza logo.png';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get payment details from navigation state
  const { currency, amount, packageType, packageName, points } = location.state || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  // Payment methods based on currency
  const paymentMethods = currency === 'EGP'
    ? [
        { id: 'credit_card', name: 'Credit/Debit Card', icon: CreditCard, logo: visaLogo, description: 'Visa, Mastercard' },
        { id: 'wallet', name: 'Mobile Wallet', icon: Wallet, description: 'Vodafone Cash, Etisalat Cash, Orange Cash' },
        { id: 'meeza', name: 'Meeza', icon: CreditCard, logo: meezaLogo, description: 'Meeza Digital Payment' },
      ]
    : [
        { id: 'credit_card', name: 'Credit Card', icon: CreditCard, logo: visaLogo, description: 'Visa, Mastercard, Amex' },
      ];

  // Calculate fees and total
  const subtotal = amount || 0;
  const processingFee = subtotal * 0.03; // 3% processing fee
  const total = subtotal + processingFee;

  const purchaseMutation = useMutation({
    mutationFn: (paymentData) => packageService.purchasePackage(packageType, paymentData),
    onSuccess: (response) => {
      // Check if response contains Paymob client secret (for EGP payments)
      if (response.data?.clientSecret) {
        // Construct Paymob unified checkout URL
        const publicKey = 'egy_pk_test_xgfkuiZo2us0viNDmSCVU1OvNnJQOUwv';
        const clientSecret = response.data.clientSecret;
        const paymobUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;

        console.log('Redirecting to Paymob:', paymobUrl);
        // Redirect to Paymob payment page
        window.location.href = paymobUrl;
      } else {
        // For non-EGP currencies, show success message
        queryClient.invalidateQueries(['myPackages']);
        queryClient.invalidateQueries(['activePackage']);
        queryClient.invalidateQueries(['pointsBalance']);
        alert(`Payment successful! ${points} points have been added to your account.`);
        navigate('/client/packages');
      }
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Payment failed. Please try again.');
    },
  });

  const handlePayment = (e) => {
    e.preventDefault();

    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    // Validate card details if credit card is selected
    if (selectedPaymentMethod === 'credit_card') {
      if (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiryDate || !cardDetails.cvv) {
        alert('Please fill in all card details');
        return;
      }
    }

    // Process payment
    purchaseMutation.mutate({
      paymentMethod: selectedPaymentMethod,
      amount: total,
      currency: currency,
      cardDetails: selectedPaymentMethod === 'credit_card' ? cardDetails : undefined,
    });
  };

  // Redirect back if no payment details
  if (!currency || !amount || !packageType) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No payment details found</p>
            <Button onClick={() => navigate('/client/packages')}>
              Go to Packages
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/client/packages')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Packages
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <Card title="Select Payment Method">
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {method.logo ? (
                        <div className="flex-shrink-0">
                          <img
                            src={method.logo}
                            alt={method.name}
                            className="h-12 w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div className={`p-3 rounded-full ${
                          selectedPaymentMethod === method.id
                            ? 'bg-primary-100'
                            : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            selectedPaymentMethod === method.id
                              ? 'text-primary-600'
                              : 'text-gray-600'
                          }`} />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <CheckCircle className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Card Details Form (only for credit/debit card) */}
          {selectedPaymentMethod === 'credit_card' && (
            <Card title="Card Details">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">We accept:</p>
                <img src={visaLogo} alt="Visa and Mastercard" className="h-8 w-auto" />
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    value={cardDetails.cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                      setCardDetails({ ...cardDetails, cardNumber: formatted });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardDetails.cardHolder}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardHolder: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength="5"
                      value={cardDetails.expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setCardDetails({ ...cardDetails, expiryDate: value });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength="4"
                      value={cardDetails.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setCardDetails({ ...cardDetails, cvv: value });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </form>
            </Card>
          )}

          {/* Wallet Selection (only for EGP) */}
          {selectedPaymentMethod === 'wallet' && (
            <Card title="Select Wallet">
              <div className="space-y-3">
                {['Vodafone Cash', 'Etisalat Cash', 'Orange Cash'].map((wallet) => (
                  <button
                    key={wallet}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 text-left transition-all"
                  >
                    <p className="font-medium text-gray-900">{wallet}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Meeza Details (only for EGP) */}
          {selectedPaymentMethod === 'meeza' && (
            <Card title="Meeza Payment">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">Pay with:</p>
                <img src={meezaLogo} alt="Meeza" className="h-10 w-auto" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <Card title="Payment Summary">
            <div className="space-y-4">
              {/* Package Details */}
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Package</p>
                  <Badge variant="primary">{packageName}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Points</p>
                  <p className="text-sm font-medium text-gray-900">{points} points</p>
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
                  <p className="text-sm text-gray-600">Processing Fee (2%)</p>
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
                    <span className="text-sm text-gray-600">{points} points added to balance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Unlock student profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Access contact information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">10 points per profile unlock</span>
                  </li>
                </ul>
              </div>

              {/* Pay Button */}
              <Button
                variant="primary"
                className="w-full mt-6"
                onClick={handlePayment}
                loading={purchaseMutation.isPending}
                disabled={!selectedPaymentMethod}
              >
                <Lock className="w-5 h-5 mr-2" />
                Pay {currency} {total.toFixed(2)}
              </Button>

              {/* Security Note */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                <Lock className="w-3 h-3" />
                <p>Secure payment powered by {currency === 'USD' ? 'Stripe' : 'Paymob'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
