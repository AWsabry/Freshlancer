import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  Users,
  XCircle,
  CheckCircle,
} from 'lucide-react';

const Jobs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  // Fetch client's jobs
  const { data, isLoading } = useQuery({
    queryKey: ['myJobs'],
    queryFn: () => jobService.getAllJobs(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (jobId) => jobService.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myJobs']);
      setDeleteModalOpen(false);
      setJobToDelete(null);
      alert('Job deleted successfully!');
    },
    onError: (error) => {
      alert(error.message || 'Failed to delete job');
    },
  });

  const handleDelete = (job) => {
    setJobToDelete(job);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      deleteMutation.mutate(jobToDelete._id);
    }
  };

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
    return <Loading text="Loading your jobs..." />;
  }

  const jobs = data?.data?.jobPosts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Job Posts</h1>
          <p className="text-gray-600 mt-1">Manage your job postings</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/client/jobs/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Post New Job
        </Button>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't posted any jobs yet.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/client/jobs/new')}
            >
              Post Your First Job
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job._id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title and Status */}
                  <div className="flex items-start gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                      {job.title}
                    </h3>
                    {getStatusBadge(job.status)}
                    {job.urgent && <Badge variant="error">Urgent</Badge>}
                    {job.featured && <Badge variant="info">Featured</Badge>}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  {/* Job Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {/* Budget */}
                    {job.budget && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="font-semibold text-green-600">
                            ${job.budget.min} - ${job.budget.max}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Applications */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-xs text-gray-500">Applications</p>
                        <p className="font-semibold">
                          {job.applicationsCount || 0}
                        </p>
                      </div>
                    </div>

                    {/* Posted Date */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Posted</p>
                        <p className="font-semibold text-sm">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Deadline */}
                    {job.deadline && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">Deadline</p>
                          <p className="font-semibold text-sm">
                            {new Date(job.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {job.skillsRequired && job.skillsRequired.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {job.skillsRequired.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skillsRequired.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            +{job.skillsRequired.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  <div className="mb-4">
                    <Badge variant="default">{job.category}</Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/client/jobs/${job._id}`)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/client/jobs/${job._id}/edit`)}
                  className="flex items-center gap-2"
                  disabled={job.status === 'completed' || job.status === 'cancelled'}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(job)}
                  className="flex items-center gap-2"
                  disabled={job.applicationsCount > 0}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Job Post"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the job post "{jobToDelete?.title}"?
          </p>
          <p className="text-sm text-red-600">
            This action cannot be undone.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
              className="flex-1"
            >
              Delete Job
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Jobs;
