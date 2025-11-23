import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerService } from '../../services/offerService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import {
  Gift,
  Tag,
  Calendar,
  Users,
  Award,
  Zap,
  Star,
  TrendingUp,
  Check,
  DollarSign,
} from 'lucide-react';

const Offers = () => {
  const queryClient = useQueryClient();
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch all offers for clients
  const { data: offersData, isLoading } = useQuery({
    queryKey: ['clientOffers'],
    queryFn: () => offerService.getAllOffers({ targetAudience: 'client' }),
  });

  // Fetch featured offers
  const { data: featuredData } = useQuery({
    queryKey: ['featuredOffers'],
    queryFn: () => offerService.getFeaturedOffers(),
  });

  // Redeem offer mutation
  const redeemMutation = useMutation({
    mutationFn: (offerId) => offerService.redeemOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientOffers']);
      queryClient.invalidateQueries(['featuredOffers']);
      queryClient.invalidateQueries(['currentUser']);
      alert('Offer redeemed successfully! Check your account for the benefits.');
      setSelectedOffer(null);
      setShowDetailsModal(false);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to redeem offer');
    },
  });

  // Get offer by coupon mutation
  const couponMutation = useMutation({
    mutationFn: (code) => offerService.getOfferByCoupon(code),
    onSuccess: (data) => {
      setSelectedOffer(data.data.offer);
      setShowCouponModal(false);
      setShowDetailsModal(true);
      setCouponCode('');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Invalid coupon code');
    },
  });

  const handleRedeemOffer = (offer) => {
    if (confirm(`Are you sure you want to redeem this offer: "${offer.title}"?`)) {
      redeemMutation.mutate(offer._id);
    }
  };

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      couponMutation.mutate(couponCode.trim());
    }
  };

  const getOfferIcon = (type) => {
    switch (type) {
      case 'discount':
        return <Tag className="w-6 h-6" />;
      case 'bonus_points':
        return <Award className="w-6 h-6" />;
      case 'free_applications':
        return <Zap className="w-6 h-6" />;
      case 'premium_trial':
        return <Star className="w-6 h-6" />;
      case 'bundle':
        return <Gift className="w-6 h-6" />;
      default:
        return <Gift className="w-6 h-6" />;
    }
  };

  const getOfferBenefit = (offer) => {
    switch (offer.offerType) {
      case 'discount':
        return `${offer.discountPercentage || offer.discountAmount}${offer.discountPercentage ? '%' : ''} OFF`;
      case 'bonus_points':
        return `+${offer.bonusPoints} Points`;
      case 'bundle':
        if (offer.packageDetails) {
          const savings = offer.packageDetails.originalPrice - offer.packageDetails.discountedPrice;
          return `Save ${offer.packageDetails.currency} ${savings}`;
        }
        return 'Special Bundle';
      default:
        return 'Special Offer';
    }
  };

  if (isLoading) {
    return <Loading text="Loading offers..." />;
  }

  const offers = offersData?.data?.offers || [];
  const featuredOffers = featuredData?.data?.offers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Gift className="w-8 h-8 text-primary-600" />
            Special Offers & Packages
          </h1>
          <p className="text-gray-600 mt-2">Exclusive deals and promotions for clients</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCouponModal(true)}
          className="flex items-center gap-2"
        >
          <Tag className="w-5 h-5" />
          Redeem Coupon
        </Button>
      </div>

      {/* Featured Offers */}
      {featuredOffers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Featured Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredOffers.map((offer) => (
              <Card
                key={offer._id}
                className="relative overflow-hidden border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-white"
              >
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-bl-lg font-bold text-xs">
                  FEATURED
                </div>

                <div className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                      {getOfferIcon(offer.offerType)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{offer.title}</h3>
                      <p className="text-2xl font-bold text-primary-600">
                        {getOfferBenefit(offer)}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Valid until {new Date(offer.endDate).toLocaleDateString()}
                    </span>
                    {offer.maxUsageCount && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {offer.maxUsageCount - offer.currentUsageCount} left
                      </span>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRedeemOffer(offer)}
                    loading={redeemMutation.isPending}
                    className="w-full"
                  >
                    Redeem Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Offers */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Offers & Packages</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offers.length === 0 ? (
            <Card className="lg:col-span-2">
              <div className="text-center py-12">
                <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No offers available at the moment.</p>
                <p className="text-gray-500 text-sm mt-2">Check back later for exciting deals!</p>
              </div>
            </Card>
          ) : (
            offers.map((offer) => (
              <Card key={offer._id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                      {getOfferIcon(offer.offerType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{offer.title}</h3>
                      <p className="text-xl font-bold text-primary-600">
                        {getOfferBenefit(offer)}
                      </p>
                    </div>
                  </div>
                  {offer.badgeText && (
                    <span className={`px-2 py-1 bg-${offer.badgeColor}-100 text-${offer.badgeColor}-800 text-xs font-semibold rounded`}>
                      {offer.badgeText}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

                {/* Package Pricing */}
                {offer.offerType === 'bundle' && offer.packageDetails && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 line-through">
                          {offer.packageDetails.currency} {offer.packageDetails.originalPrice}
                        </p>
                        <p className="text-3xl font-bold text-primary-600">
                          {offer.packageDetails.currency} {offer.packageDetails.discountedPrice}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">You Save</p>
                        <p className="text-2xl font-bold text-green-600">
                          {offer.packageDetails.currency} {offer.packageDetails.originalPrice - offer.packageDetails.discountedPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {offer.packageDetails?.features && offer.packageDetails.features.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Includes:</p>
                    <ul className="space-y-1">
                      {offer.packageDetails.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>Until {new Date(offer.endDate).toLocaleDateString()}</span>
                  </div>
                  {offer.maxUsageCount && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{offer.maxUsageCount - offer.currentUsageCount} remaining</span>
                    </div>
                  )}
                </div>

                {offer.couponCode && (
                  <div className="mb-4 p-2 bg-gray-100 rounded flex items-center justify-between">
                    <span className="text-xs text-gray-600">Code:</span>
                    <code className="font-mono font-bold text-sm">{offer.couponCode}</code>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRedeemOffer(offer)}
                    loading={redeemMutation.isPending}
                    className="flex-1"
                  >
                    Redeem Offer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOffer(offer);
                      setShowDetailsModal(true);
                    }}
                  >
                    Details
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Coupon Modal */}
      <Modal
        isOpen={showCouponModal}
        onClose={() => {
          setShowCouponModal(false);
          setCouponCode('');
        }}
        title="Redeem Coupon Code"
        size="sm"
      >
        <form onSubmit={handleCouponSubmit} className="space-y-4">
          <Alert
            type="info"
            message="Enter your coupon code to unlock special offers and discounts."
          />

          <Input
            label="Coupon Code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="e.g., SUMMER2024"
            required
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCouponModal(false);
                setCouponCode('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={couponMutation.isPending}
              className="flex-1"
            >
              Apply Coupon
            </Button>
          </div>
        </form>
      </Modal>

      {/* Offer Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOffer(null);
        }}
        title="Offer Details"
        size="md"
      >
        {selectedOffer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                {getOfferIcon(selectedOffer.offerType)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedOffer.title}</h3>
                <p className="text-3xl font-bold text-primary-600">
                  {getOfferBenefit(selectedOffer)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{selectedOffer.description}</p>
            </div>

            {selectedOffer.offerType === 'bundle' && selectedOffer.packageDetails && (
              <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Original Price</p>
                    <p className="text-2xl font-bold text-gray-400 line-through">
                      {selectedOffer.packageDetails.currency} {selectedOffer.packageDetails.originalPrice}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Special Price</p>
                    <p className="text-3xl font-bold text-primary-600">
                      {selectedOffer.packageDetails.currency} {selectedOffer.packageDetails.discountedPrice}
                    </p>
                  </div>
                </div>
                <div className="text-center p-2 bg-green-100 rounded">
                  <p className="text-sm font-semibold text-green-800">
                    You Save: {selectedOffer.packageDetails.currency} {selectedOffer.packageDetails.originalPrice - selectedOffer.packageDetails.discountedPrice}
                  </p>
                </div>
              </div>
            )}

            {selectedOffer.packageDetails?.features && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">What's Included:</h4>
                <ul className="space-y-2">
                  {selectedOffer.packageDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valid From</p>
                <p className="font-semibold">{new Date(selectedOffer.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Valid Until</p>
                <p className="font-semibold">{new Date(selectedOffer.endDate).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedOffer.terms && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Terms & Conditions:</h4>
                <p className="text-sm text-yellow-800">{selectedOffer.terms}</p>
              </div>
            )}

            <Button
              variant="primary"
              onClick={() => handleRedeemOffer(selectedOffer)}
              loading={redeemMutation.isPending}
              className="w-full"
            >
              Redeem This Offer
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Offers;
