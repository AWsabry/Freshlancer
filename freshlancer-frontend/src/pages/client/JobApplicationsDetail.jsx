import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';
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
  MapPin,
  Briefcase,
  Eye,
  Lock,
  Unlock,
  User,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';

const JobApplicationsDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for filters and sorting
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterNationality, setFilterNationality] = useState('');
  const [filterExperience, setFilterExperience] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch job details
  const { data: jobData, isLoading: loadingJob } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getJob(jobId),
  });

  // Fetch applications with filters
  const {
    data: applicationsData,
    isLoading: loadingApplications,
    error: applicationsError,
  } = useQuery({
    queryKey: ['jobApplications', jobId, sortBy, sortOrder, filterNationality, filterExperience, filterStatus, page],
    queryFn: () =>
      applicationService.getJobApplications(jobId, {
        sortBy,
        sortOrder,
        nationality: filterNationality,
        experienceLevel: filterExperience,
        status: filterStatus,
        page,
        limit,
      }),
  });

  // Unlock contact mutation
  const unlockMutation = useMutation({
    mutationFn: (applicationId) => applicationService.unlockContact(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobApplications', jobId]);
      queryClient.invalidateQueries(['currentUser']);
    },
  });

  // Accept application mutation
  const acceptMutation = useMutation({
    mutationFn: (applicationId) => applicationService.acceptApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobApplications', jobId]);
      alert('Application accepted! The student has been notified that they can be contacted to discuss the project.');
    },
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: (applicationId) => applicationService.rejectApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobApplications', jobId]);
      alert('Application rejected. The student has been notified.');
    },
  });

  const handleUnlock = async (applicationId) => {
    if (confirm('Unlock this student\'s contact for 10 points?')) {
      try {
        await unlockMutation.mutateAsync(applicationId);
        alert('Student contact unlocked successfully!');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to unlock contact');
      }
    }
  };

  const handleAccept = async (applicationId) => {
    if (confirm('Accept this application? The student will be notified that they can be contacted to discuss the project.')) {
      try {
        await acceptMutation.mutateAsync(applicationId);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to accept application');
      }
    }
  };

  const handleReject = async (applicationId) => {
    if (confirm('Reject this application? The student will be notified.')) {
      try {
        await rejectMutation.mutateAsync(applicationId);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to reject application');
      }
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  if (loadingJob || loadingApplications) {
    return <Loading text="Loading applications..." />;
  }

  if (applicationsError) {
    return (
      <Alert
        type="error"
        message={`Failed to load applications: ${applicationsError.response?.data?.message || applicationsError.message}`}
      />
    );
  }

  const job = jobData?.data?.jobPost;
  const applications = applicationsData?.data?.applications || [];
  const pagination = applicationsData?.data?.pagination || {};
  const uniqueNationalities = applicationsData?.data?.uniqueNationalities || [];

  const SortIcon = sortOrder === 'asc' ? SortAsc : SortDesc;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/client/applications')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Applications
        </Button>
      </div>

      {/* Job Details Card */}
      <Card>
        <div className="flex items-start gap-4">
          <Briefcase className="w-8 h-8 text-primary-600 mt-1" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{job?.title}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-700">
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="font-semibold">{job?.budget?.currency} {job?.budget?.min} - {job?.budget?.max}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="font-semibold">{new Date(job?.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-semibold">{job?.projectDuration}</p>
                </div>
              </div>
        
            </div>
            <div className="flex items-center gap-2">
              {job?.status === 'cancelled' && <Badge variant="error">Cancelled</Badge>}
              {job?.status === 'completed' && <Badge variant="success">Completed</Badge>}
              {job?.status === 'open' && <Badge variant="info">Open</Badge>}
              {job?.status && !['cancelled', 'completed', 'open'].includes(job.status) && (
                <Badge variant="default">{job.status}</Badge>
              )}
              <Badge variant="info">{job?.category}</Badge>
              <Badge variant="success">{applications.length} Applicants</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters and Sorting */}
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">Filters & Sorting</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Nationality Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nationality
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filterNationality}
              onChange={(e) => {
                setFilterNationality(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Nationalities</option>
              {uniqueNationalities.map((nat) => (
                <option key={nat} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filterExperience}
              onChange={(e) => {
                setFilterExperience(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="createdAt">Application Date</option>
              <option value="proposedBudget">Proposed Budget</option>
              <option value="relevantExperienceLevel">Experience Level</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <SortIcon className="w-4 h-4" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
        </div>
      </Card>

      {/* Applications List */}
      <Card title={`All Applicants (${pagination.total || 0})`}>
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No applications match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const isUnlocked = application.contactUnlockedByClient;
              const student = application.student;

              return (
                <div
                  key={application._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                >
                  <div className="flex items-start justify-between">
                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {isUnlocked ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                              {student?.photo ? (
                                <img
                                  src={student.photo}
                                  alt={student.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-primary-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{student?.name}</h3>
                              <p className="text-sm text-gray-600">{student?.email}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 text-gray-400" />
                            <p className="text-gray-500">Contact Locked</p>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Proposed Budget</p>
                          <p className="font-bold text-green-600 text-lg">
                            ${application.proposedBudget?.amount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-semibold">{application.estimatedDuration}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Experience</p>
                          <Badge variant="info">
                            {application.relevantExperienceLevel || 'Not specified'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Nationality</p>
                          <p className="font-semibold">{student?.nationality || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={
                          application.status === 'pending' ? 'info' :
                          application.status === 'accepted' ? 'success' :
                          application.status === 'rejected' ? 'error' : 'default'
                        }>
                          {application.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Applied {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {isUnlocked ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/client/students/${student?._id}`)}
                          >
                            <User className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAccept(application._id)}
                            loading={acceptMutation.isPending}
                            disabled={application.status === 'accepted'}
                          >
                            {application.status === 'accepted' ? 'Accepted' : 'Accept'}
                          </Button>
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleReject(application._id)}
                            loading={rejectMutation.isPending}
                            disabled={application.status === 'rejected'}
                          >
                            {application.status === 'rejected' ? 'Rejected' : 'Reject'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlock(application._id)}
                          loading={unlockMutation.isPending}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Unlock (10 pts)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm font-medium">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default JobApplicationsDetail;
