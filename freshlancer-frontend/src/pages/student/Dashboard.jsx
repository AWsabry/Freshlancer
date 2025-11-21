import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../../services/subscriptionService';
import { applicationService } from '../../services/applicationService';
import { contractService } from '../../services/contractService';
import { verificationService } from '../../services/verificationService';
import { authService } from '../../services/authService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { Briefcase, FileText, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const StudentDashboard = () => {
  // Fetch verification status
  const { data: verificationStatus, isLoading: loadingVerification } = useQuery({
    queryKey: ['verificationStatus'],
    queryFn: () => verificationService.getVerificationStatus(),
  });

  // Fetch current user data (including application counts)
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getMe(),
  });

  // Fetch subscription info
  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMySubscription(),
  });

  // Fetch recent applications
  const { data: applications, isLoading: loadingApplications } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationService.getMyApplications({ limit: 5 }),
  });

  // Fetch active contracts
  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ['myContracts'],
    queryFn: () => contractService.getMyContracts({ status: 'active' }),
  });

  if (loadingVerification || loadingSubscription || loadingUser) {
    return <Loading text="Loading dashboard..." />;
  }

  const isVerified = verificationStatus?.data?.isVerified;
  const subscriptionData = subscription?.data?.subscription;
  const studentProfile = userData?.data?.user?.studentProfile;

  // Get application data from user profile
  const applicationsUsedThisMonth = studentProfile?.applicationsUsedThisMonth || 0;
  const subscriptionTier = studentProfile?.subscriptionTier || 'free';
  const applicationLimitPerMonth = subscriptionTier === 'premium' ? 100 : 10;
  const applicationsRemaining = applicationLimitPerMonth - applicationsUsedThisMonth;
  return (
    <div className="space-y-6">
      {/* Verification Alert */}
      {!isVerified && (
        <Alert
          type="warning"
          title="Verification Required"
          message="Please complete your student verification to start applying for jobs."
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Applications This Month</p>
              <p className="text-3xl font-bold text-gray-900">
                {applicationsUsedThisMonth}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {applicationLimitPerMonth} this month
              </p>
            </div>
            <Briefcase className="w-12 h-12 text-primary-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Applications Remaining</p>
              <p className="text-3xl font-bold text-green-600">
                {applicationsRemaining}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {subscriptionTier === 'premium' ? 'Premium Plan' : 'Free Plan'}
              </p>
            </div>
            <FileText className="w-12 h-12 text-green-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verification</p>
              <Badge variant={isVerified ? 'success' : 'warning'}>
                {isVerified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            {isVerified ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : (
              <Clock className="w-12 h-12 text-yellow-500" />
            )}
          </div>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Package</p>
              <Badge variant="primary">
                {subscriptionTier === 'premium' ? 'Premium' : 'Free'}
              </Badge>
            </div>
            <DollarSign className="w-12 h-12 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!isVerified ? (
            <Link to="/student/verification">
              <Button variant="primary" className="w-full">
                <AlertCircle className="w-5 h-5 mr-2" />
                Complete Verification
              </Button>
            </Link>
          ) : (
            <Link to="/student/jobs">
              <Button variant="primary" className="w-full">
                <Briefcase className="w-5 h-5 mr-2" />
                Browse Jobs
              </Button>
            </Link>
          )}

          <Link to="/student/applications">
            <Button variant="outline" className="w-full">
              <FileText className="w-5 h-5 mr-2" />
              View Applications
            </Button>
          </Link>

          {subscriptionTier === 'free' && applicationsRemaining < 3 && (
            <Link to="/student/subscription">
              <Button variant="success" className="w-full">
                Upgrade to Premium
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Recent Applications */}
      <Card title="Recent Applications">
        {loadingApplications ? (
          <Loading />
        ) : applications?.data?.applications?.length > 0 ? (
          <div className="space-y-4">
            {applications.data.applications.map((app) => (
              <div key={app._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{app.jobPost?.title}</h4>
                  <p className="text-sm text-gray-600">{app.jobPost?.client?.companyName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Applied {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={
                    app.status === 'accepted' ? 'success' :
                    app.status === 'rejected' ? 'error' :
                    app.status === 'shortlisted' ? 'warning' : 'info'
                  }
                >
                  {app.status}
                </Badge>
              </div>
            ))}
            <Link to="/student/applications">
              <Button variant="outline" size="sm" className="w-full">
                View All Applications
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No applications yet</p>
            {isVerified && (
              <Link to="/student/jobs">
                <Button variant="primary" size="sm" className="mt-4">
                  Browse Jobs
                </Button>
              </Link>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentDashboard;
