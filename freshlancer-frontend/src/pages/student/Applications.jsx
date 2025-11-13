import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import {
  Eye,
  DollarSign,
  Calendar,
  Briefcase,
  Clock,
  FileText,
} from 'lucide-react';

const Applications = () => {
  const navigate = useNavigate();

  // Fetch student's applications
  const { data, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationService.getMyApplications(),
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'info', label: 'Pending Review' },
      reviewed: { variant: 'default', label: 'Reviewed' },
      accepted: { variant: 'success', label: 'Accepted' },
      rejected: { variant: 'error', label: 'Rejected' },
      withdrawn: { variant: 'default', label: 'Withdrawn' },
    };
    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <Loading text="Loading your applications..." />;
  }

  const applications = data?.data?.applications || [];

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

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">You haven't applied to any jobs yet.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/student/jobs')}
            >
              Browse Available Jobs
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application._id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Job Title and Status */}
                  <div className="flex items-start gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                      {application.jobPost?.title || 'Job Title'}
                    </h3>
                    {getStatusBadge(application.status)}
                  </div>

                  {/* Company Info */}
                  {application.jobPost?.client && (
                    <p className="text-gray-600 mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {application.jobPost.client.clientProfile?.companyName ||
                       application.jobPost.client.name}
                    </p>
                  )}

                  {/* Application Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {/* Proposed Budget */}
                    {application.proposedBudget && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Your Bid</p>
                          <p className="font-semibold text-green-600">
                            ${application.proposedBudget.amount}
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

                    {/* Job Budget Range */}
                    {application.jobPost?.budget && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Job Budget</p>
                          <p className="font-semibold text-sm">
                            ${application.jobPost.budget.min} - ${application.jobPost.budget.max}
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

                  {/* Job Category */}
                  {application.jobPost?.category && (
                    <div className="mb-3">
                      <Badge variant="default">{application.jobPost.category}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/student/jobs/${application.jobPost?._id}`)}
                  className="flex items-center gap-2"
                  disabled={!application.jobPost}
                >
                  <Eye className="w-4 h-4" />
                  View Job
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/student/applications/${application._id}`)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Application
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;
