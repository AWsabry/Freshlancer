import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { authService } from '../../services/authService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import {
  DollarSign,
  Calendar,
  Briefcase,
  Clock,
  FileText,
  XCircle,
  CheckCircle,
  Filter,
  Unlock,
  AlertCircle,
  Eye,
} from 'lucide-react';

const Applications = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'accepted', 'rejected', 'withdrawn'

  // Fetch student's applications
  const { data, isLoading, error } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationService.getMyApplications(),
  });

  // Fetch current user to check premium status
  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getMe(),
  });

  const allApplications = data?.data?.applications || [];

  // Check if user is premium
  const studentProfile = userData?.data?.user?.studentProfile;
  const isPremium = studentProfile?.subscriptionTier === 'premium';

  // Apply status filter
  const applications = useMemo(() => {
    try {
      if (statusFilter === 'all') {
        return Array.isArray(allApplications) ? allApplications : [];
      }
      return Array.isArray(allApplications)
        ? allApplications.filter((app) => app && app.status === statusFilter)
        : [];
    } catch (err) {
      console.error('Error filtering applications by status:', err);
      return [];
    }
  }, [statusFilter, allApplications]);

  // Count applications by status for filter badges
  const statusCounts = useMemo(() => {
    try {
      if (!Array.isArray(allApplications)) {
        return { all: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 };
      }

      return {
        all: allApplications.length,
        pending: allApplications.filter((app) => app && app.status === 'pending').length,
        accepted: allApplications.filter((app) => app && app.status === 'accepted').length,
        rejected: allApplications.filter((app) => app && app.status === 'rejected').length,
        withdrawn: allApplications.filter((app) => app && app.status === 'withdrawn').length,
      };
    } catch (err) {
      console.error('Error counting applications:', err);
      return { all: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 };
    }
  }, [allApplications]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'info', label: 'Pending', icon: Clock },
      reviewed: { variant: 'warning', label: 'Reviewed', icon: Eye },
      accepted: { variant: 'success', label: 'Accepted', icon: CheckCircle },
      rejected: { variant: 'error', label: 'Rejected', icon: XCircle },
      withdrawn: { variant: 'default', label: 'Withdrawn', icon: AlertCircle },
    };
    const config = statusConfig[status] || { variant: 'default', label: status, icon: FileText };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Now safe to have conditional returns after all hooks
  if (isLoading) {
    return <Loading text="Loading your applications..." />;
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 mb-4">Failed to load applications</p>
          <p className="text-sm text-gray-500 mb-4">
            {error.response?.data?.message || error.message}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </Card>
    );
  }

  const renderApplicationCard = (application) => {
    // Safety check
    if (!application || !application._id) {
      return null;
    }

    return (
      <Card key={application._id}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Job Title and Status */}
            <div className="flex items-start gap-3 mb-3">
              <h3 className="text-xl font-bold text-gray-900 flex-1">
                {application.jobPost?.title || 'Job Title'}
              </h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(application.status || 'pending')}
                {/* Premium + Contact Unlocked Badge */}
                {isPremium && application.contactUnlockedByClient && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    Contact Unlocked
                  </Badge>
                )}
              </div>
              {/* Job Category */}
              <div className="flex items-center gap-2">
              {application.jobPost?.category && (
                <Badge variant="default">{application.jobPost.category}</Badge>
              )}
                {/* Premium + Contact Unlocked Badge */}
                {isPremium && application.contactUnlockedByClient && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    Contact Unlocked
                  </Badge>
                )}
              </div>

            </div>

            {/* Withdrawal Notice - Show if withdrawn by client */}
            {application.status === 'withdrawn' &&
             application.withdrawalReason === 'Job was withdrawn by client' && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  This job was withdrawn by the client
                </p>
              </div>
            )}

          {/* Company Info - Only for Premium Users */}
          {isPremium && application.jobPost?.client && (
            <p className="text-gray-600 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {application.jobPost.client.clientProfile?.companyName ||
               application.jobPost.client.email}
            </p>
          )}

          {/* Premium Upgrade Message for Free Users */}
          {!isPremium && (
            <p className="text-gray-600 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm text-gray-500 italic">
                Upgrade to Premium to see Client's Email
              </span>
            </p>
          )}

          {/* Application Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Proposed Budget */}
            {application.proposedBudget && (
              <div className="flex items-center gap-2 text-gray-600">
                <div>
                  <p className="text-xs text-gray-500">Your Bid</p>
                  <p className="font-semibold text-green-600">
                    {application.proposedBudget.currency} {application.proposedBudget.amount}
                  </p>
                </div>
              </div>
            )}

            {/* Applied Date */}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Applied On</p>
                <p className="font-semibold text-sm">
                  {new Date(application.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Duration */}
            {application.estimatedDuration && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-semibold text-sm">
                    {application.estimatedDuration}
                  </p>
                </div>
              </div>
            )}

            {/* Job Budget Range - Only for Premium Users */}
            {isPremium && application.jobPost?.budget && (
              <div className="flex items-center gap-2 text-gray-600">
                <div>
                  <p className="text-xs text-gray-500">Job Budget</p>
                  <p className="font-semibold text-sm">
                    {application.jobPost.budget.currency} ${application.jobPost.budget.min} - ${application.jobPost.budget.max}
                  </p>
                </div>
              </div>
            )}

            {/* Premium Upgrade for Budget - Free Users */}
            {!isPremium && (
              <div className="flex items-center gap-2 text-gray-600">
                <div>
                  <p className="text-xs text-gray-500">Job Budget</p>
                  <p className="font-semibold text-sm text-gray-400 italic">
                    Premium Only
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Proposal Type */}
          {application.proposalType && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                {application.proposalType.charAt(0).toUpperCase() +
                 application.proposalType.slice(1)} Proposal
              </span>
            </div>
          )}

          {/* Client Feedback */}
          {application.clientFeedback && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Client Feedback:
              </p>
              <p className="text-sm text-blue-800">
                {application.clientFeedback.message}
              </p>
            </div>
          )}


        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(`/student/applications/${application._id}`)}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View Application
        </Button>
      </div>
    </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">Track all your job applications</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/student/jobs')}
          className="flex items-center gap-2"
        >
          <Briefcase className="w-5 h-5" />
          Browse Jobs
        </Button>
      </div>

      {/* No Applications */}
      {allApplications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">You haven't applied to any jobs yet.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Status Filter */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      statusFilter === 'all'
                        ? 'bg-primary-600 text-black'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({statusCounts.all})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      statusFilter === 'pending'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Pending ({statusCounts.pending})
                  </button>
                  <button
                    onClick={() => setStatusFilter('accepted')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      statusFilter === 'accepted'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accepted ({statusCounts.accepted})
                  </button>
                  <button
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      statusFilter === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Rejected ({statusCounts.rejected})
                  </button>
                  <button
                    onClick={() => setStatusFilter('withdrawn')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      statusFilter === 'withdrawn'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Withdrawn ({statusCounts.withdrawn})
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Applications List */}
          {applications.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">
                  {statusFilter === 'all'
                    ? 'No applications'
                    : `No ${statusFilter} applications`}
                </p>
  
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => renderApplicationCard(application))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Applications;
