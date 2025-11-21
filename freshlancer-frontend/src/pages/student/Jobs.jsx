import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { jobService } from '../../services/jobService';
import { subscriptionService } from '../../services/subscriptionService';
import { authService } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Filter,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';

const Jobs = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'applied'

  // Check subscription/application limit
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMySubscription(),
  });

  // Fetch current user with appliedJobs from profile
  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getMe(),
  });

  // Get applied jobs from user profile
  const userAppliedJobs = userData?.data?.user?.studentProfile?.appliedJobs || [];

  // Check if student is on premium plan
  const subscription = subscriptionData?.data?.subscription;
  const isPremium = subscription?.plan === 'premium';

  // Fetch jobs with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['jobs', searchQuery, category],
    queryFn: ({ pageParam = 1 }) => {
      const params = { page: pageParam, limit: 10 };
      if (searchQuery) {
        return jobService.searchJobs(searchQuery, params);
      }
      if (category) params.category = category;
      return jobService.getAllJobs(params);
    },
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
  });

  const allJobs = data?.pages.flatMap((page) => page.data.jobPosts) || [];

  // Fetch full details for applied jobs
  const appliedJobIds = useMemo(
    () => userAppliedJobs.map(job => job.jobId?.toString()).filter(Boolean),
    [userAppliedJobs]
  );

  const { data: appliedJobsData } = useQuery({
    queryKey: ['appliedJobs', appliedJobIds],
    queryFn: async () => {
      if (appliedJobIds.length === 0) return { data: { jobPosts: [] } };
      // Fetch all applied jobs by their IDs
      const promises = appliedJobIds.map(jobId =>
        jobService.getJob(jobId).catch(() => null)
      );
      const results = await Promise.all(promises);
      return {
        data: {
          jobPosts: results
            .filter(result => result?.data?.jobPost)
            .map(result => result.data.jobPost)
        }
      };
    },
    enabled: appliedJobIds.length > 0,
  });

  const appliedJobsFromAPI = appliedJobsData?.data?.jobPosts || [];

  // Separate available jobs from applied jobs
  const appliedJobIdsSet = useMemo(
    () => new Set(userAppliedJobs.map((job) => job.jobId?.toString())),
    [userAppliedJobs]
  );

  const availableJobs = useMemo(
    () => allJobs.filter((job) => !appliedJobIdsSet.has(job._id)),
    [allJobs, appliedJobIdsSet]
  );

  // Build applied jobs array with application metadata
  const appliedJobs = useMemo(() => {
    // Create a map of applied jobs metadata from user profile
    const appliedJobMetadata = new Map(
      userAppliedJobs.map(job => [job.jobId?.toString(), job])
    );

    // Map full job data with application status
    return appliedJobsFromAPI
      .map((job) => {
        const metadata = appliedJobMetadata.get(job._id);
        if (metadata) {
          return {
            ...job,
            applicationStatus: metadata.status,
            appliedAt: metadata.appliedAt,
          };
        }
        return null;
      })
      .filter(job => job !== null);
  }, [appliedJobsFromAPI, userAppliedJobs]);

  const jobs = activeTab === 'available' ? availableJobs : appliedJobs;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchQuery(searchInput);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Mobile Development', label: 'Mobile Development' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Machine Learning', label: 'Machine Learning' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Content Writing', label: 'Content Writing' },
    { value: 'Digital Marketing', label: 'Digital Marketing' },
    { value: 'Graphic Design', label: 'Graphic Design' },
    { value: 'Video Editing', label: 'Video Editing' },
    { value: 'Translation', label: 'Translation' },
    { value: 'Research', label: 'Research' },
    { value: 'Other', label: 'Other' },
  ];

  const applicationsRemaining =
    subscription?.applicationLimitPerMonth - subscription?.applicationsUsedThisMonth;

  if (isLoading) {
    return <Loading text="Loading jobs..." />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
        <p className="text-gray-600">
          Find your next opportunity • {subscription?.plan === 'premium' ? 'Unlimited' : applicationsRemaining} applications remaining
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`${
                activeTab === 'available'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Briefcase className="w-5 h-5" />
              Available Jobs ({availableJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`${
                activeTab === 'applied'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <CheckCircle className="w-5 h-5" />
              Applied Jobs ({appliedJobs.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, skills, or keywords... (Press Enter to search)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearSearch}
                className="flex items-center gap-2"
              >
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <Select
                label="Category"
                options={categories}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              {/* Add more filters as needed */}
            </div>
          )}
        </form>
      </div>

      {/* Application Limit Warning */}
      {subscription?.plan !== 'premium' && applicationsRemaining < 3 && (
        <Alert
          type="warning"
          message={`You have only ${applicationsRemaining} application${applicationsRemaining !== 1 ? 's' : ''} remaining this month. Upgrade to Premium for unlimited applications!`}
          className="mb-6"
        />
      )}

      {/* Job Feed */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No jobs found</p>
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => navigate(`/student/jobs/${job._id}`)}
            >
              <div className="p-6">
                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600">
                      {job.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {isPremium ? (job.client?.clientProfile?.companyEmail || job.client?.email) : 'Premium members only'}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="info">{job.category}</Badge>
                    {job.urgent && <Badge variant="error">Urgent</Badge>}
                    {activeTab === 'applied' && job.applicationStatus && (
                      <Badge
                        variant={
                          job.applicationStatus === 'accepted'
                            ? 'success'
                            : job.applicationStatus === 'rejected'
                            ? 'error'
                            : job.applicationStatus === 'shortlisted'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {job.applicationStatus}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Applied At (for applied jobs) */}
                {activeTab === 'applied' && job.appliedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Applied on {new Date(job.appliedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-700 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Skills */}
                {job.skillsRequired && job.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skillsRequired.slice(0, 5).map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skillsRequired.length > 5 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        +{job.skillsRequired.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
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
              
                  Subscribe to see budget
                </Button>
              )}
                    {job.duration && (
                      <span className="text-sm text-gray-600">
                        {job.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {job.applicationsCount || 0} applicant{job.applicationsCount !== 1 ? 's' : ''}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/jobs/${job._id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Load More Button */}
        {hasNextPage && (
          <div className="text-center py-6">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
              disabled={isFetchingNextPage}
              className="flex items-center gap-2 mx-auto"
            >
              {isFetchingNextPage ? 'Loading more...' : 'Load More Jobs'}
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
        )}

        {!hasNextPage && jobs.length > 0 && (
          <div className="text-center py-6 text-gray-500">
            You've reached the end of the list
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
