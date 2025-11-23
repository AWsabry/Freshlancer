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
import Select from '../../components/common/Select';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Gift,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Tag,
  Eye,
  Award,
} from 'lucide-react';

const Offers = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [filterAudience, setFilterAudience] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAudience: 'both',
    offerType: 'discount',
    discountPercentage: '',
    discountAmount: '',
    bonusPoints: '',
    bonusApplications: '',
    premiumTrialDays: '',
    startDate: '',
    endDate: '',
    maxUsageCount: '',
    featured: false,
    priority: 0,
    badgeText: '',
    badgeColor: 'blue',
    couponCode: '',
    terms: '',
    imageUrl: '',
    packageDetails: {
      originalPrice: '',
      discountedPrice: '',
      currency: 'USD',
      features: [''],
    },
  });

  // Fetch offers
  const { data: offersData, isLoading } = useQuery({
    queryKey: ['offers', filterAudience, filterType, filterActive],
    queryFn: () =>
      offerService.getAllOffers({
        targetAudience: filterAudience,
        offerType: filterType,
        isActive: filterActive,
      }),
  });

  // Fetch offer stats
  const { data: statsData } = useQuery({
    queryKey: ['offerStats', selectedOffer?._id],
    queryFn: () => offerService.getOfferStats(selectedOffer._id),
    enabled: !!selectedOffer && showStatsModal,
  });

  // Create offer mutation
  const createMutation = useMutation({
    mutationFn: (data) => offerService.createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      setShowCreateModal(false);
      resetForm();
      alert('Offer created successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create offer');
    },
  });

  // Update offer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => offerService.updateOffer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      setShowEditModal(false);
      setSelectedOffer(null);
      resetForm();
      alert('Offer updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update offer');
    },
  });

  // Delete offer mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => offerService.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      alert('Offer deleted successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete offer');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id) => offerService.toggleOfferActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to toggle offer status');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetAudience: 'both',
      offerType: 'discount',
      discountPercentage: '',
      discountAmount: '',
      bonusPoints: '',
      bonusApplications: '',
      premiumTrialDays: '',
      startDate: '',
      endDate: '',
      maxUsageCount: '',
      featured: false,
      priority: 0,
      badgeText: '',
      badgeColor: 'blue',
      couponCode: '',
      terms: '',
      imageUrl: '',
      packageDetails: {
        originalPrice: '',
        discountedPrice: '',
        currency: 'USD',
        features: [''],
      },
    });
  };

  const handleEdit = (offer) => {
    setSelectedOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      targetAudience: offer.targetAudience,
      offerType: offer.offerType,
      discountPercentage: offer.discountPercentage || '',
      discountAmount: offer.discountAmount || '',
      bonusPoints: offer.bonusPoints || '',
      bonusApplications: offer.bonusApplications || '',
      premiumTrialDays: offer.premiumTrialDays || '',
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
      maxUsageCount: offer.maxUsageCount || '',
      featured: offer.featured,
      priority: offer.priority,
      badgeText: offer.badgeText || '',
      badgeColor: offer.badgeColor,
      couponCode: offer.couponCode || '',
      terms: offer.terms || '',
      imageUrl: offer.imageUrl || '',
      packageDetails: offer.packageDetails || {
        originalPrice: '',
        discountedPrice: '',
        currency: 'USD',
        features: [''],
      },
    });
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clean up formData - remove empty fields
    const cleanedData = { ...formData };

    // Remove empty package features
    if (cleanedData.packageDetails?.features) {
      cleanedData.packageDetails.features = cleanedData.packageDetails.features.filter(f => f.trim());
    }

    // Convert date strings to Date objects
    cleanedData.startDate = new Date(cleanedData.startDate);
    cleanedData.endDate = new Date(cleanedData.endDate);

    if (showEditModal && selectedOffer) {
      updateMutation.mutate({ id: selectedOffer._id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePackageChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        [field]: value,
      },
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        features: [...prev.packageDetails.features, ''],
      },
    }));
  };

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        features: prev.packageDetails.features.map((f, i) => i === index ? value : f),
      },
    }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        features: prev.packageDetails.features.filter((_, i) => i !== index),
      },
    }));
  };

  if (isLoading) {
    return <Loading text="Loading offers..." />;
  }

  const offers = offersData?.data?.offers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Gift className="w-8 h-8 text-primary-600" />
            Offers & Packages Management
          </h1>
          <p className="text-gray-600 mt-2">Create and manage special offers for students and clients</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Offer
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Target Audience"
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            options={[
              { value: '', label: 'All Audiences' },
              { value: 'student', label: 'Students Only' },
              { value: 'client', label: 'Clients Only' },
              { value: 'both', label: 'Both' },
            ]}
          />
          <Select
            label="Offer Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: '', label: 'All Types' },
              { value: 'discount', label: 'Discount' },
              { value: 'bonus_points', label: 'Bonus Points' },
              { value: 'free_applications', label: 'Free Applications' },
              { value: 'premium_trial', label: 'Premium Trial' },
              { value: 'bundle', label: 'Bundle' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          <Select
            label="Status"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
        </div>
      </Card>

      {/* Offers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {offers.length === 0 ? (
          <Card className="lg:col-span-2">
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No offers found. Create your first offer!</p>
            </div>
          </Card>
        ) : (
          offers.map((offer) => (
            <Card key={offer._id} className={!offer.isActive ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{offer.title}</h3>
                    {offer.featured && (
                      <Award className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{offer.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant={offer.isActive ? 'success' : 'error'}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="info">
                      {offer.targetAudience === 'both' ? 'All Users' :
                       offer.targetAudience === 'student' ? 'Students' : 'Clients'}
                    </Badge>
                    <Badge variant="default">
                      {offer.offerType.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {offer.badgeText && (
                      <span className={`px-2 py-1 bg-${offer.badgeColor}-100 text-${offer.badgeColor}-800 text-xs font-semibold rounded`}>
                        {offer.badgeText}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {offer.currentUsageCount} / {offer.maxUsageCount || '∞'} used
                      </span>
                    </div>
                  </div>

                  {offer.couponCode && (
                    <div className="mt-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary-600" />
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                        {offer.couponCode}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOffer(offer);
                    setShowStatsModal(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Stats
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(offer)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActiveMutation.mutate(offer._id)}
                  className="flex items-center gap-1"
                >
                  {offer.isActive ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  Toggle
                </Button>
                <Button
                  variant="error"
                  size="sm"
                  onClick={() => handleDelete(offer._id)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedOffer(null);
          resetForm();
        }}
        title={showEditModal ? 'Edit Offer' : 'Create New Offer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="e.g., Summer Special - 50% Off"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Describe the offer..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Target Audience"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              required
              options={[
                { value: 'student', label: 'Students Only' },
                { value: 'client', label: 'Clients Only' },
                { value: 'both', label: 'Both' },
              ]}
            />

            <Select
              label="Offer Type"
              name="offerType"
              value={formData.offerType}
              onChange={handleInputChange}
              required
              options={[
                { value: 'discount', label: 'Discount' },
                { value: 'bonus_points', label: 'Bonus Points' },
                { value: 'free_applications', label: 'Free Applications' },
                { value: 'premium_trial', label: 'Premium Trial' },
                { value: 'bundle', label: 'Bundle Package' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
          </div>

          {/* Conditional fields based on offer type */}
          {formData.offerType === 'discount' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Discount Percentage (%)"
                name="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={handleInputChange}
                placeholder="e.g., 50"
              />
              <Input
                label="Discount Amount"
                name="discountAmount"
                type="number"
                min="0"
                value={formData.discountAmount}
                onChange={handleInputChange}
                placeholder="e.g., 100"
              />
            </div>
          )}

          {formData.offerType === 'bonus_points' && (
            <Input
              label="Bonus Points"
              name="bonusPoints"
              type="number"
              min="0"
              value={formData.bonusPoints}
              onChange={handleInputChange}
              required
              placeholder="e.g., 500"
            />
          )}

          {formData.offerType === 'free_applications' && (
            <Input
              label="Bonus Applications"
              name="bonusApplications"
              type="number"
              min="0"
              value={formData.bonusApplications}
              onChange={handleInputChange}
              required
              placeholder="e.g., 10"
            />
          )}

          {formData.offerType === 'premium_trial' && (
            <Input
              label="Premium Trial Days"
              name="premiumTrialDays"
              type="number"
              min="1"
              value={formData.premiumTrialDays}
              onChange={handleInputChange}
              required
              placeholder="e.g., 7"
            />
          )}

          {formData.offerType === 'bundle' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Package Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Original Price"
                  type="number"
                  min="0"
                  value={formData.packageDetails.originalPrice}
                  onChange={(e) => handlePackageChange('originalPrice', e.target.value)}
                  placeholder="e.g., 100"
                />
                <Input
                  label="Discounted Price"
                  type="number"
                  min="0"
                  value={formData.packageDetails.discountedPrice}
                  onChange={(e) => handlePackageChange('discountedPrice', e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
              <Select
                label="Currency"
                value={formData.packageDetails.currency}
                onChange={(e) => handlePackageChange('currency', e.target.value)}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'EGP', label: 'EGP' },
                  { value: 'GBP', label: 'GBP' },
                ]}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                {formData.packageDetails.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Feature description"
                    />
                    <Button
                      type="button"
                      variant="error"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addFeature}>
                  Add Feature
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Usage Count (optional)"
              name="maxUsageCount"
              type="number"
              min="1"
              value={formData.maxUsageCount}
              onChange={handleInputChange}
              placeholder="Leave empty for unlimited"
            />
            <Input
              label="Priority (higher = shown first)"
              name="priority"
              type="number"
              value={formData.priority}
              onChange={handleInputChange}
              placeholder="0"
            />
          </div>

          <Input
            label="Coupon Code (optional)"
            name="couponCode"
            value={formData.couponCode}
            onChange={handleInputChange}
            placeholder="e.g., SUMMER2024"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Badge Text (optional)"
              name="badgeText"
              value={formData.badgeText}
              onChange={handleInputChange}
              placeholder="e.g., HOT DEAL"
            />
            <Select
              label="Badge Color"
              name="badgeColor"
              value={formData.badgeColor}
              onChange={handleInputChange}
              options={[
                { value: 'red', label: 'Red' },
                { value: 'blue', label: 'Blue' },
                { value: 'green', label: 'Green' },
                { value: 'yellow', label: 'Yellow' },
                { value: 'purple', label: 'Purple' },
                { value: 'pink', label: 'Pink' },
              ]}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Featured Offer</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions (optional)
            </label>
            <textarea
              name="terms"
              value={formData.terms}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Terms and conditions..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedOffer(null);
                resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {showEditModal ? 'Update Offer' : 'Create Offer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => {
          setShowStatsModal(false);
          setSelectedOffer(null);
        }}
        title="Offer Statistics"
        size="md"
      >
        {statsData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Usage</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {statsData.data.stats.totalUsage}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Remaining</p>
                  <p className="text-3xl font-bold text-green-600">
                    {statsData.data.stats.remainingUsage}
                  </p>
                </div>
              </Card>
            </div>

            {statsData.data.stats.recentUsage && statsData.data.stats.recentUsage.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recent Usage</h4>
                <div className="space-y-2">
                  {statsData.data.stats.recentUsage.map((usage, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{usage.user?.name}</p>
                        <p className="text-sm text-gray-600">{usage.user?.email}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(usage.usedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Offers;
