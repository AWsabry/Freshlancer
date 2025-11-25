import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { jobService } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';
import { subscriptionService } from '../../services/subscriptionService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import {
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  ArrowLeft,
} from 'lucide-react';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      proposedBudgetCurrency: 'USD',
    },
  });

  // Fetch job details
  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id),
  });

  // Check subscription
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMySubscription(),
  });

  // Check application limit
  const { data: limitData } = useQuery({
    queryKey: ['applicationLimit'],
    queryFn: () => subscriptionService.checkApplicationLimit(),
  });

  // Check if student has already applied to this job (from database)
  const { data: applicationStatusData } = useQuery({
    queryKey: ['applicationStatus', id],
    queryFn: () => applicationService.checkApplicationStatus(id),
    enabled: !!id,
  });

  const hasAlreadyApplied = applicationStatusData?.data?.hasApplied || false;
  const existingApplication = applicationStatusData?.data?.application || null;

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: (applicationData) => applicationService.applyToJob(applicationData),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription']);
      queryClient.invalidateQueries(['applicationLimit']);
      queryClient.invalidateQueries(['myApplications']);
      queryClient.invalidateQueries(['applicationStatus', id]); // Invalidate application status
      queryClient.invalidateQueries(['jobs']); // Invalidate jobs list to update Available/Applied tabs
      setShowApplicationModal(false);
      reset();
      alert('Application submitted successfully! The job has been moved to your Applied Jobs.');
      navigate('/student/jobs');
    },
    onError: (error) => {
      alert(error.message || 'Failed to submit application');
    },
  });

  const onSubmit = (data) => {
    const applicationData = {
      jobPost: id,
      proposalType: data.proposalType,
      proposedBudget: {
        amount: parseFloat(data.proposedBudget),
        currency: data.proposedBudgetCurrency || 'USD',
      },
      estimatedDuration: data.estimatedDuration,
      approachSelections: {
        methodology: data.methodology,
        deliveryFrequency: data.deliveryFrequency,
        revisions: parseInt(data.revisions),
        communicationPreference: data.communicationPreference,
      },
      availabilityCommitment: data.availabilityCommitment,
      relevantExperienceLevel: data.relevantExperienceLevel,
    };

    // Add optional proposal text if provided (premium feature)
    if (data.proposalText) {
      applicationData.proposalText = data.proposalText;
    }

    applyMutation.mutate(applicationData);
  };

  if (isLoading) {
    return <Loading text="Loading job details..." />;
  }

  const job = jobData?.data?.jobPost;
  const canApply = limitData?.data?.canApply;
  const currentUsage = limitData?.data?.currentUsage || 0;
  const monthlyLimit = limitData?.data?.limit || 10;
  const resetDate = limitData?.data?.resetDate;
  const subscription = subscriptionData?.data?.subscription;
  const isPremium = subscription?.plan === 'premium' || limitData?.data?.plan === 'premium';
  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Job not found</p>
        <Button onClick={() => navigate('/student/jobs')} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/student/jobs')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Jobs
      </button>

      {/* Job Header */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              {isPremium && (<span className="flex items-center gap-1">
                <Briefcase className="w-5 h-5" />
                {job.client?.clientProfile?.companyEmail || job.client?.email}
              </span>)}
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-5 h-5" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-5 h-5" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="info">{job.category}</Badge>
            {job.urgent && <Badge variant="error">Urgent</Badge>}
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          {job.budget && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Budget</p>
              {isPremium ? (
                <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                  {job.budget.currency} {job.budget.min} - {job.budget.max}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/student/subscription')}
                  className="flex items-center gap-1"
                >
                  <DollarSign className="w-4 h-4" />
                  Subscribe to see budget
                </Button>
              )}
            </div>
          )}
          {job.duration && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="text-lg font-semibold text-gray-900">{job.duration}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1">Applicants</p>
            <p className="text-lg font-semibold text-gray-900">
              {job.applicationsCount || 0}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">Description</h2>
          <p className="text-gray-700 whitespace-pre-line break-words overflow-wrap-anywhere">{job.description}</p>
        </div>

        {/* Skills Required */}
        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="pt-6 border-t">
          {hasAlreadyApplied ? (
            <div>
              <Alert
                type="success"
                message={`You have already applied for this job. Application status: ${existingApplication?.status || 'pending'}`}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate(`/student/applications/${existingApplication?._id}`)}
                >
                  View My Application
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate('/student/applications')}
                >
                  All Applications
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Monthly Usage Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Applications This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentUsage} / {monthlyLimit}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={isPremium ? 'success' : 'info'}>
                      {isPremium ? 'Premium' : 'Free'}
                    </Badge>
                  </div>
                </div>
                {resetDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Resets on {new Date(resetDate).toLocaleDateString()}
                  </p>
                )}
                {!isPremium && currentUsage > monthlyLimit * 0.7 && (
                  <Alert
                    type="warning"
                    message={`You've used ${currentUsage} of ${monthlyLimit} applications. Upgrade to Premium for 100 applications per month!`}
                    className="mt-3"
                  />
                )}
              </div>

              {!canApply && (
                <Alert
                  type="error"
                  message={`You've reached your monthly application limit of ${monthlyLimit}. ${
                    isPremium
                      ? 'Your limit will reset on the first day of next month.'
                      : 'Upgrade to Premium for 100 applications per month!'
                  }`}
                  className="mb-4"
                />
              )}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setShowApplicationModal(true)}
                disabled={!canApply}
              >
                Apply for this Job
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Application Modal */}
      <Modal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        title="Apply for Job"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Alert
            type="info"
            message="Complete the application form using only the provided options. No free-text responses allowed."
          />

          <Select
            label="Proposal Type"
            options={[
              { value: 'standard', label: 'Standard Proposal' },
              { value: 'express', label: 'Express (Fast Delivery)' },
              { value: 'premium', label: 'Premium (High Quality)' },
              { value: 'custom', label: 'Custom Approach' },
            ]}
            error={errors.proposalType?.message}
            {...register('proposalType', { required: 'Proposal type is required' })}
          />

          {/* Proposal Text - Premium Feature */}
          {isPremium && (
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposal Message (Optional)
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                  Premium Only
                </span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows="4"
                placeholder="Add a personalized message to the client about why you're the best fit for this project..."
                maxLength="1000"
                {...register('proposalText', {
                  maxLength: { value: 1000, message: 'Proposal text must be less than 1000 characters' },
                })}
              />
              {errors.proposalText?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.proposalText.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Max 1000 characters. This message will be visible to the client.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Proposed Budget Amount"
              type="number"
              min="1"
              step="0.01"
              error={errors.proposedBudget?.message}
              {...register('proposedBudget', {
                required: 'Proposed budget is required',
                min: { value: 1, message: 'Budget must be at least $1' },
              })}
            />

            <Select
              label="Currency"
              options={[
                { value: 'USD', label: 'USD ($) - US Dollar' },
                { value: 'EUR', label: 'EUR (€) - Euro' },
                { value: 'EGP', label: 'EGP (£) - Egyptian Pound' },
                { value: 'GBP', label: 'GBP (£) - British Pound' },
                { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
                { value: 'SAR', label: 'SAR (﷼) - Saudi Riyal' },
                { value: 'QAR', label: 'QAR (﷼) - Qatari Riyal' },
                { value: 'KWD', label: 'KWD (د.ك) - Kuwaiti Dinar' },
                { value: 'BHD', label: 'BHD (.د.ب) - Bahraini Dinar' },
                { value: 'OMR', label: 'OMR (﷼) - Omani Rial' },
                { value: 'JOD', label: 'JOD (د.ا) - Jordanian Dinar' },
                { value: 'LBP', label: 'LBP (ل.ل) - Lebanese Pound' },
                { value: 'ILS', label: 'ILS (₪) - Israeli Shekel' },
                { value: 'TRY', label: 'TRY (₺) - Turkish Lira' },
                { value: 'ZAR', label: 'ZAR (R) - South African Rand' },
                { value: 'MAD', label: 'MAD (د.م.) - Moroccan Dirham' },
                { value: 'TND', label: 'TND (د.ت) - Tunisian Dinar' },
                { value: 'DZD', label: 'DZD (د.ج) - Algerian Dinar' },
                { value: 'NGN', label: 'NGN (₦) - Nigerian Naira' },
                { value: 'KES', label: 'KES (KSh) - Kenyan Shilling' },
                { value: 'GHS', label: 'GHS (₵) - Ghanaian Cedi' },
                { value: 'UGX', label: 'UGX (USh) - Ugandan Shilling' },
                { value: 'TZS', label: 'TZS (TSh) - Tanzanian Shilling' },
                { value: 'ETB', label: 'ETB (Br) - Ethiopian Birr' },
                { value: 'CHF', label: 'CHF (Fr) - Swiss Franc' },
                { value: 'SEK', label: 'SEK (kr) - Swedish Krona' },
                { value: 'NOK', label: 'NOK (kr) - Norwegian Krone' },
                { value: 'DKK', label: 'DKK (kr) - Danish Krone' },
                { value: 'PLN', label: 'PLN (zł) - Polish Zloty' },
                { value: 'CZK', label: 'CZK (Kč) - Czech Koruna' },
                { value: 'HUF', label: 'HUF (Ft) - Hungarian Forint' },
                { value: 'RON', label: 'RON (lei) - Romanian Leu' },
                { value: 'BGN', label: 'BGN (лв) - Bulgarian Lev' },
                { value: 'HRK', label: 'HRK (kn) - Croatian Kuna' },
                { value: 'RUB', label: 'RUB (₽) - Russian Ruble' },
                { value: 'UAH', label: 'UAH (₴) - Ukrainian Hryvnia' },
              ]}
              error={errors.proposedBudgetCurrency?.message}
              {...register('proposedBudgetCurrency', { required: 'Currency is required' })}
            />
          </div>

          <Select
            label="Estimated Duration"
            options={[
              { value: 'Less than 1 week', label: 'Less than 1 week' },
              { value: '1-2 weeks', label: '1-2 weeks' },
              { value: '2-4 weeks', label: '2-4 weeks' },
              { value: '1-3 months', label: '1-3 months' },
              { value: 'More than 3 months', label: 'More than 3 months' },
            ]}
            error={errors.estimatedDuration?.message}
            {...register('estimatedDuration', { required: 'Duration is required' })}
          />

          <Select
            label="Methodology"
            options={[
              { value: 'Agile', label: 'Agile' },
              { value: 'Waterfall', label: 'Waterfall' },
              { value: 'Iterative', label: 'Iterative' },
              { value: 'Prototype-First', label: 'Prototype-First' },
              { value: 'Standard', label: 'Standard' },
            ]}
            {...register('methodology')}
          />

          <Select
            label="Delivery Frequency"
            options={[
              { value: 'Daily updates', label: 'Daily updates' },
              { value: 'Weekly updates', label: 'Weekly updates' },
              { value: 'Bi-weekly updates', label: 'Bi-weekly updates' },
              { value: 'Monthly updates', label: 'Monthly updates' },
              { value: 'Upon completion', label: 'Upon completion' },
            ]}
            {...register('deliveryFrequency')}
          />

          <Input
            label="Number of Revisions (0-10)"
            type="number"
            min="0"
            max="10"
            defaultValue="2"
            {...register('revisions')}
          />

          <Select
            label="Communication Preference"
            options={[
              { value: 'Email only', label: 'Email only' },
              { value: 'Chat preferred', label: 'Chat preferred' },
              { value: 'Video calls available', label: 'Video calls available' },
              { value: 'Flexible', label: 'Flexible' },
            ]}
            {...register('communicationPreference')}
          />

          <Select
            label="Availability Commitment"
            options={[
              { value: 'Full-time (40+ hours/week)', label: 'Full-time (40+ hours/week)' },
              { value: 'Part-time (20-40 hours/week)', label: 'Part-time (20-40 hours/week)' },
              { value: 'Part-time (10-20 hours/week)', label: 'Part-time (10-20 hours/week)' },
              { value: 'Weekends only', label: 'Weekends only' },
              { value: 'Flexible hours', label: 'Flexible hours' },
            ]}
            error={errors.availabilityCommitment?.message}
            {...register('availabilityCommitment', { required: 'Availability is required' })}
          />

          <Select
            label="Relevant Experience Level"
            options={[
              { value: 'This is my first project in this category', label: 'This is my first project' },
              { value: 'I have 1-3 similar projects', label: '1-3 similar projects' },
              { value: 'I have 3-5 similar projects', label: '3-5 similar projects' },
              { value: 'I have 5+ similar projects', label: '5+ similar projects' },
              { value: 'I am an expert in this field', label: 'Expert in this field' },
            ]}
            {...register('relevantExperienceLevel')}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowApplicationModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={applyMutation.isPending}
              disabled={applyMutation.isPending}
              className="flex-1"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JobDetails;
