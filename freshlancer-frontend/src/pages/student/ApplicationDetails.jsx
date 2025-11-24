import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { authService } from '../../services/authService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Unlock,
} from 'lucide-react';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch application details
  const { data: applicationData, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getApplication(id),
  });

  // Fetch current user to check premium status
  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getMe(),
  });

  // Withdraw application mutation
  const withdrawMutation = useMutation({
    mutationFn: () => applicationService.withdrawApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['application', id]);
      queryClient.invalidateQueries(['myApplications']);
      queryClient.invalidateQueries(['jobs']);
      alert('Application withdrawn successfully');
      navigate('/student/applications');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to withdraw application');
    },
  });

  const handleWithdraw = () => {
    if (window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      withdrawMutation.mutate();
    }
  };

  if (isLoading) {
    return <Loading text="Loading application details..." />;
  }

  const application = applicationData?.data?.application;

  // Check if user is premium
  const studentProfile = userData?.data?.user?.studentProfile;
  const isPremium = studentProfile?.subscriptionTier === 'premium';

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Application not found</p>
        <Button onClick={() => navigate('/student/applications')} className="mt-4">
          Back to Applications
        </Button>
      </div>
    );
  }

  const job = application.jobPost;
  const canWithdraw = application.status === 'pending' || application.status === 'reviewed';

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'info', label: 'Pending Review', icon: Clock },
      reviewed: { variant: 'warning', label: 'Reviewed', icon: Eye },
      accepted: { variant: 'success', label: 'Accepted', icon: CheckCircle },
      rejected: { variant: 'error', label: 'Rejected', icon: XCircle },
      withdrawn: { variant: 'default', label: 'Withdrawn', icon: AlertCircle },
    };
    const config = statusConfig[status] || { variant: 'default', label: status, icon: FileText };
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/student/applications')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Applications
      </button>

      {/* Application Header */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Application Details</h1>
            <p className="text-gray-600">Application ID: {application._id}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(application.status)}
            {/* Contact Unlocked Indicator - Premium Only */}
            {isPremium && application.contactUnlockedByClient && (
              <Badge variant="success" className="flex items-center gap-1">
                <Unlock className="w-4 h-4" />
                Contact Unlocked by Client
              </Badge>
            )}
          </div>
        </div>

        {/* Contact Unlocked Alert - Premium Only */}
        {isPremium && application.contactUnlockedByClient && (
          <Alert
            type="success"
            message="Great news! The client has unlocked your contact information. They are interested in your application and may reach out to you directly."
            className="mb-4"
          />
        )}

        {/* Status Messages */}
        {application.status === 'pending' && (
          <Alert
            type="info"
            message="Your application is pending review. The client will review it soon."
            className="mb-4"
          />
        )}
        {application.status === 'accepted' && (
          <Alert
            type="success"
            message="Congratulations! Your application has been accepted. The client will contact you soon."
            className="mb-4"
          />
        )}
        {application.status === 'rejected' && (
          <Alert
            type="error"
            message="Unfortunately, your application was not accepted for this job."
            className="mb-4"
          />
        )}
        {application.status === 'withdrawn' && (
          <Alert
            type="warning"
            message={
              application.withdrawalReason === 'Job was withdrawn by client'
                ? 'This job was withdrawn by the client. Your application has been automatically withdrawn.'
                : application.withdrawalReason
                ? `Application withdrawn: ${application.withdrawalReason}`
                : 'This application has been withdrawn.'
            }
            className="mb-4"
          />
        )}

        {/* Client Feedback */}
        {application.clientFeedback && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Client Feedback
            </h3>
            <p className="text-blue-800">{application.clientFeedback.message}</p>
            {application.clientFeedback.timestamp && (
              <p className="text-sm text-blue-600 mt-2">
                Received: {new Date(application.clientFeedback.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Application Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Applied On</p>
            <p className="font-semibold text-gray-900">
              {new Date(application.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(application.createdAt).toLocaleTimeString()}
            </p>
          </div>
          {application.updatedAt && application.updatedAt !== application.createdAt && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="font-semibold text-gray-900">
                {new Date(application.updatedAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(application.updatedAt).toLocaleTimeString()}
              </p>
            </div>
          )}
          {application.reviewedAt && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Reviewed On</p>
              <p className="font-semibold text-gray-900">
                {new Date(application.reviewedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Job Details */}
      {job && (
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/student/jobs/${job._id}`)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Full Job
            </Button>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{job.title}</h3>

            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
              {/* Client Email - Only for Premium Users */}
              {isPremium && job.client && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-5 h-5" />
                  {job.client.clientProfile?.companyEmail || job.client.email}
                </span>
              )}

              {/* Premium Upgrade Message for Free Users */}
              {!isPremium && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-5 h-5" />
                  <span className="text-sm text-gray-500 italic">
                    Upgrade to Premium to see Client Email
                  </span>
                </span>
              )}

              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-5 h-5" />
                  {job.location}
                </span>
              )}
              {job.category && <Badge variant="info">{job.category}</Badge>}
              {job.urgent && <Badge variant="error">Urgent</Badge>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              {/* Job Budget - Only for Premium Users */}
              {isPremium && job.budget && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Job Budget</p>
                  <div className="flex items-center gap-1 font-semibold text-gray-900">
                    <DollarSign className="w-5 h-5" />
                    {job.budget.currency} ${job.budget.min} - ${job.budget.max}
                  </div>
                </div>
              )}

              {/* Premium Upgrade for Budget - Free Users */}
              {!isPremium && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Job Budget</p>
                  <div className="flex items-center gap-1 font-semibold text-gray-400">
                    <span className="text-sm italic">Premium Only</span>
                  </div>
                </div>
              )}

              {job.duration && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">{job.duration}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Posted</p>
                <p className="font-semibold text-gray-900">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 whitespace-pre-line line-clamp-4">{job.description}</p>
            </div>

            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Skills Required</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Your Proposal */}
      <Card className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Proposal</h2>

        <div className="space-y-6">
          {/* Proposal Type and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Proposal Type</h3>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium">
                  {application.proposalType?.charAt(0).toUpperCase() + application.proposalType?.slice(1) || 'Standard'}
                </span>
              </div>
            </div>

            {application.proposedBudget && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Your Proposed Budget</h3>
                <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
                  {application.proposedBudget.amount}
                  {application.proposedBudget.currency && (
                    <span className="text-lg"> {application.proposedBudget.currency}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Duration and Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {application.estimatedDuration && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Estimated Duration</h3>
                <p className="text-gray-900 font-medium">{application.estimatedDuration}</p>
              </div>
            )}

            {application.availabilityCommitment && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Availability Commitment</h3>
                <p className="text-gray-900 font-medium">{application.availabilityCommitment}</p>
              </div>
            )}
          </div>

          {/* Approach Selections */}
          {application.approachSelections && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Approach & Methodology</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {application.approachSelections.methodology && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Methodology</p>
                    <p className="font-medium text-gray-900">{application.approachSelections.methodology}</p>
                  </div>
                )}

                {application.approachSelections.deliveryFrequency && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Delivery Frequency</p>
                    <p className="font-medium text-gray-900">{application.approachSelections.deliveryFrequency}</p>
                  </div>
                )}

                {application.approachSelections.revisions !== undefined && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Number of Revisions</p>
                    <p className="font-medium text-gray-900">{application.approachSelections.revisions}</p>
                  </div>
                )}

                {application.approachSelections.communicationPreference && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Communication Preference</p>
                    <p className="font-medium text-gray-900">{application.approachSelections.communicationPreference}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience Level */}
          {application.relevantExperienceLevel && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Relevant Experience Level</h3>
              <p className="text-gray-900 font-medium">{application.relevantExperienceLevel}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/student/applications')}
            className="flex-1"
          >
            Back to All Applications
          </Button>

          {job && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/student/jobs/${job._id}`)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Full Job Details
            </Button>
          )}

          {canWithdraw && (
            <Button
              variant="outline"
              onClick={handleWithdraw}
              loading={withdrawMutation.isPending}
              disabled={withdrawMutation.isPending}
              className="flex-1 text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
            >
              Withdraw Application
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ApplicationDetails;
