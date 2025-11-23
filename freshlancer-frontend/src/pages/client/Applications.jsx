import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { authService } from '../../services/authService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import {
  Eye,
  DollarSign,
  Calendar,
  FileText,
  Briefcase,
} from 'lucide-react';

const Applications = () => {
  const navigate = useNavigate();

  // Fetch applications for all jobs
  const { data: applicationsData, isLoading: loadingApplications, error: applicationsError } = useQuery({
    queryKey: ['allApplications'],
    queryFn: async () => {
      return applicationService.getMyApplications({ limit: 100 });
    },
  });

  // Fetch user data (including points)
  const { data: userData, isLoading: loadingPoints } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getMe(),
  });

  // Group applications by job
  const groupedApplications = useMemo(() => {
    try {
      const applications = applicationsData?.data?.applications || [];
      const grouped = {};

      applications.forEach((app) => {
        const jobId = app.jobPost?._id;
        if (!jobId) {
          console.warn('Application without jobPost:', app);
          return;
        }

        if (!grouped[jobId]) {
          grouped[jobId] = {
            job: app.jobPost,
            applications: [],
          };
        }
        grouped[jobId].applications.push(app);
      });

      return Object.values(grouped);
    } catch (error) {
      console.error('Error grouping applications:', error);
      return [];
    }
  }, [applicationsData]);

  if (loadingApplications || loadingPoints) {
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

  const pointsRemaining = userData?.data?.user?.clientProfile?.pointsRemaining || 0;

  return (
    <div className="space-y-6">
      {/* Header with Points */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-600 mt-1">Review applications grouped by job posting</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
            <p className="text-sm text-primary-600 font-medium">Available Points</p>
            <p className="text-2xl font-bold text-primary-700">{pointsRemaining}</p>
            <p className="text-xs text-primary-500">10 points per contact</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/client/packages')}>
            Get More Points
          </Button>
        </div>
      </div>

      {/* Low Points Warning */}
      {pointsRemaining < 10 && (
        <Alert type="warning" message="You have insufficient points to unlock student contacts. Purchase a package to continue viewing applicant details." />
      )}

      {/* Grouped Applications by Job */}
      {groupedApplications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No applications received yet.</p>
            <Button variant="primary" onClick={() => navigate('/client/jobs/new')}>
              Post a Job
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedApplications.map(({ job, applications }) => (
            <Card key={job._id}>
              {/* Job Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-6 h-6 text-primary-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${job.budget?.min} - ${job.budget?.max}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                        <Badge variant="info">{job.category}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{applications.length} Applicant{applications.length !== 1 ? 's' : ''}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/client/jobs/${job._id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Job
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/client/jobs/${job._id}/applications`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View All Applications
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;
