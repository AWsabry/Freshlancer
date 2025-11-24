import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import {
  ArrowLeft,
  Edit2,
  DollarSign,
  Calendar,
  Users,
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  // Fetch job details
  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id),
  });

  // Withdraw mutation (close job as cancelled)
  const withdrawMutation = useMutation({
    mutationFn: () => jobService.closeJob(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['job', id]);
      queryClient.invalidateQueries(['myJobs']);
      setWithdrawModalOpen(false);
      alert('Job withdrawn successfully! All applications have been marked as withdrawn.');
    },
    onError: (error) => {
      alert(error.message || 'Failed to withdraw job');
    },
  });

  // Complete mutation (close job as completed)
  const completeMutation = useMutation({
    mutationFn: () => jobService.closeJob(id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['job', id]);
      queryClient.invalidateQueries(['myJobs']);
      setCompleteModalOpen(false);
      alert('Job marked as completed! All non-accepted applications have been rejected.');
    },
    onError: (error) => {
      alert(error.message || 'Failed to complete job');
    },
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { variant: 'success', label: 'Open' },
      in_progress: { variant: 'info', label: 'In Progress' },
      completed: { variant: 'default', label: 'Completed' },
      cancelled: { variant: 'error', label: 'Cancelled' },
    };
    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <Loading text="Loading job details..." />;
  }

  const job = jobData?.data?.jobPost;

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Job not found</p>
        <Button onClick={() => navigate('/client/jobs')} className="mt-4">
          Back to My Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/client/jobs')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to My Jobs
      </button>

      {/* Job Header */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-5 h-5" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="w-5 h-5" />
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {getStatusBadge(job.status)}
            {job.urgent && <Badge variant="error">Urgent</Badge>}
            {job.featured && <Badge variant="info">Featured</Badge>}
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          {job.budget && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Budget</p>
              <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                {job.budget.currency} {job.budget.min} - {job.budget.max}
              </div>
            </div>
          )}
          {job.projectDuration && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="text-lg font-semibold text-gray-900">{job.projectDuration}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1">Applications</p>
            <p className="text-lg font-semibold text-gray-900">
              {job.applicationsCount || 0}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-line break-words overflow-wrap-anywhere">{job.description}</p>
        </div>

        {/* Skills Required */}
        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Required Skills</h2>
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

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Category</h3>
            <Badge variant="default">{job.category}</Badge>
          </div>

          {job.experienceLevel && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Experience Level</h3>
              <p className="text-gray-700">{job.experienceLevel}</p>
            </div>
          )}

          {job.applicationType && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Application Type</h3>
              <p className="text-gray-700">
                {job.applicationType === 'open' ? 'Open to All Students' : 'Invite Only'}
              </p>
            </div>
          )}

          {job.projectDuration && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Project Duration</h3>
              <p className="text-gray-700">{job.projectDuration}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => navigate(`/client/jobs/${job._id}/edit`)}
            className="flex items-center gap-2"
            disabled={job.status === 'completed' || job.status === 'cancelled'}
          >
            <Edit2 className="w-5 h-5" />
            Edit Job
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/client/applications')}
            className="flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            View Applications ({job.applicationsCount || 0})
          </Button>

          {/* Show Complete and Withdraw buttons only for open jobs */}
          {job.status === 'open' && (
            <>
              <Button
                variant="success"
                onClick={() => setCompleteModalOpen(true)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Completed
              </Button>
              <Button
                variant="warning"
                onClick={() => setWithdrawModalOpen(true)}
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5" />
                Withdraw Job
              </Button>
            </>
          )}


        </div>
      </Card>

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Withdraw Job Post"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to withdraw the job post "{job?.title}"?
          </p>
          <p className="text-sm text-orange-600">
            This will:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Close the job as cancelled</li>
            <li>Mark all applications for this job as withdrawn</li>
            <li>Students will see their applications as withdrawn in their view</li>
          </ul>
          <p className="text-sm text-red-600 font-medium">
            This action cannot be undone.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setWithdrawModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={() => withdrawMutation.mutate()}
              loading={withdrawMutation.isPending}
              disabled={withdrawMutation.isPending}
              className="flex-1"
            >
              Withdraw Job
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete Confirmation Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Mark Job as Completed"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to mark the job post "{job?.title}" as completed?
          </p>
          <p className="text-sm text-blue-600">
            This will:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Close the job as completed</li>
            <li>Reject all pending and reviewed applications</li>
            <li>Keep accepted applications as accepted</li>
            <li>Students will see their non-accepted applications as rejected</li>
          </ul>
          <p className="text-sm text-red-600 font-medium">
            This action cannot be undone.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setCompleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => completeMutation.mutate()}
              loading={completeMutation.isPending}
              disabled={completeMutation.isPending}
              className="flex-1"
            >
              Mark as Completed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JobDetails;
