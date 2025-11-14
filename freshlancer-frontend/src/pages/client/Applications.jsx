import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import {
  Eye,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Lock,
  Unlock,
  Star,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const Applications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState(new Set());

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'info', label: 'Pending' },
      reviewed: { variant: 'default', label: 'Reviewed' },
      accepted: { variant: 'success', label: 'Accepted' },
      rejected: { variant: 'error', label: 'Rejected' },
      withdrawn: { variant: 'default', label: 'Withdrawn' },
    };
    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const toggleJobExpansion = (jobId) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const handleViewStudent = (application) => {
    setSelectedApplication(application);
    setShowStudentModal(true);
  };

  const handleUnlockContact = async () => {
    const pointsRemaining = userData?.data?.user?.clientProfile?.pointsRemaining || 0;

    if (pointsRemaining < 10) {
      alert('Insufficient points! You need 10 points to unlock student contact details. Redirecting to packages...');
      navigate('/client/packages');
      return;
    }

    try {
      // Call API to unlock and deduct points
      const response = await applicationService.unlockContact(selectedApplication._id);

      // Update selected application with unlocked data
      // The api interceptor unwraps one level, so response is already response.data from axios
      const unlockedApp = response.data?.application;

      if (unlockedApp) {
        setSelectedApplication(unlockedApp);
      } else {
        setSelectedApplication({
          ...selectedApplication,
          contactUnlockedByClient: true,
          contactUnlockedAt: new Date(),
        });
      }

      // Refresh data
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['allApplications']);

      // Close modal and show success message
      setShowStudentModal(false);
      alert('Student contact unlocked successfully! 10 points deducted.');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to unlock contact';
      alert(`Error: ${errorMsg}`);

      if (errorMsg.includes('Insufficient points')) {
        navigate('/client/packages');
      }
    }
  };

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
          {groupedApplications.map(({ job, applications }) => {
            const isExpanded = expandedJobs.has(job._id);

            return (
              <Card key={job._id}>
                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
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
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleJobExpansion(job._id)}
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-4 h-4 mr-2" />Hide</>
                      ) : (
                        <><ChevronDown className="w-4 h-4 mr-2" />Show</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Applications Table */}
                {isExpanded && (
                  <div className="border-t pt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Proposed Budget
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Applied On
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {applications.map((application) => (
                            <tr key={application._id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {application.contactUnlockedByClient ? (
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {application.student?.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {application.student?.email}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-gray-500">
                                      <Lock className="w-4 h-4" />
                                      <span className="text-sm">Locked</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-green-600">
                                  ${application.proposedBudget?.amount || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {application.estimatedDuration}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(application.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {getStatusBadge(application.status)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant={application.contactUnlockedByClient ? "primary" : "outline"}
                                  size="sm"
                                  onClick={() => handleViewStudent(application)}
                                >
                                  {application.contactUnlockedByClient ? (
                                    <><Eye className="w-4 h-4 mr-1" />View</>
                                  ) : (
                                    <><Lock className="w-4 h-4 mr-1" />Unlock (10 pts)</>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Student Details Modal */}
      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} title="Applicant Details" size="lg">
        {selectedApplication && (
          <div className="space-y-6">
            {selectedApplication.contactUnlockedByClient ? (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Unlock className="w-5 h-5 text-green-600" />
                    Student Information
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-semibold">Name:</span> {selectedApplication.student?.name}</p>
                    <p><span className="font-semibold">Email:</span> {selectedApplication.student?.email}</p>
                    {selectedApplication.student?.age && <p><span className="font-semibold">Age:</span> {selectedApplication.student.age}</p>}
                    {selectedApplication.student?.nationality && <p><span className="font-semibold">Nationality:</span> {selectedApplication.student.nationality}</p>}
                    {selectedApplication.student?.studentProfile?.university && <p><span className="font-semibold">University:</span> {selectedApplication.student.studentProfile.university}</p>}
                    {selectedApplication.student?.studentProfile?.major && <p><span className="font-semibold">Major:</span> {selectedApplication.student.studentProfile.major}</p>}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-3">Proposal Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Proposed Budget</p>
                      <p className="font-bold text-green-600 text-lg">${selectedApplication.proposedBudget?.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Duration</p>
                      <p className="font-semibold">{selectedApplication.estimatedDuration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Proposal Type</p>
                      <p className="font-semibold capitalize">{selectedApplication.proposalType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Experience Level</p>
                      <p className="font-semibold">{selectedApplication.relevantExperienceLevel || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {selectedApplication.approachSelections && (
                  <div>
                    <h3 className="font-bold text-lg mb-3">Approach & Methodology</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedApplication.approachSelections.methodology && (
                        <div>
                          <p className="text-sm text-gray-600">Methodology</p>
                          <p className="font-semibold">{selectedApplication.approachSelections.methodology}</p>
                        </div>
                      )}
                      {selectedApplication.approachSelections.deliveryFrequency && (
                        <div>
                          <p className="text-sm text-gray-600">Delivery Frequency</p>
                          <p className="font-semibold">{selectedApplication.approachSelections.deliveryFrequency}</p>
                        </div>
                      )}
                      {selectedApplication.approachSelections.revisions !== undefined && (
                        <div>
                          <p className="text-sm text-gray-600">Revisions Included</p>
                          <p className="font-semibold">{selectedApplication.approachSelections.revisions}</p>
                        </div>
                      )}
                      {selectedApplication.approachSelections.communicationPreference && (
                        <div>
                          <p className="text-sm text-gray-600">Communication</p>
                          <p className="font-semibold">{selectedApplication.approachSelections.communicationPreference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedApplication.availabilityCommitment && (
                  <div>
                    <h3 className="font-bold text-lg mb-3">Availability</h3>
                    <p className="text-gray-700">{selectedApplication.availabilityCommitment}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="secondary" onClick={() => setShowStudentModal(false)} className="flex-1">
                    Close
                  </Button>
                  <Button variant="success" className="flex-1">
                    Accept Application
                  </Button>
                  <Button variant="error" className="flex-1">
                    Reject
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Lock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Student Contact Locked</h3>
                <p className="text-gray-600 mb-4">Unlock this student's contact information to view their full details.</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800">Cost: <span className="font-bold">10 points</span></p>
                  <p className="text-yellow-700 text-sm">Your balance: <span className="font-bold">{pointsRemaining} points</span></p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setShowStudentModal(false)} className="flex-1">Cancel</Button>
                  <Button variant="primary" onClick={handleUnlockContact} disabled={pointsRemaining < 10} className="flex-1">
                    {pointsRemaining < 10 ? 'Insufficient Points' : 'Unlock for 10 Points'}
                  </Button>
                </div>
                {pointsRemaining < 10 && <p className="text-sm text-red-600 mt-2">You need more points. Click "Get More Points" to purchase a package.</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Applications;
