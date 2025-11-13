import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { packageService } from '../../services/packageService';
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
} from 'lucide-react';

const Applications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Fetch applications for all jobs
  const { data: applicationsData, isLoading: loadingApplications } = useQuery({
    queryKey: ['allApplications'],
    queryFn: async () => {
      return applicationService.getMyApplications();
    },
  });

  // Fetch points balance
  const { data: pointsData, isLoading: loadingPoints } = useQuery({
    queryKey: ['pointsBalance'],
    queryFn: () => packageService.getPointsBalance(),
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

  const handleViewStudent = (application) => {
    setSelectedApplication(application);
    setShowStudentModal(true);
  };

  const handleUnlockContact = async () => {
    const pointsRemaining = pointsData?.data?.pointsRemaining || 0;

    if (pointsRemaining < 10) {
      alert('Insufficient points! You need 10 points to unlock student contact details. Redirecting to packages...');
      navigate('/client/packages');
      return;
    }

    try {
      // Call API to unlock and deduct points
      const response = await applicationService.unlockContact(selectedApplication._id);

      // Update selected application with unlocked data
      setSelectedApplication(response.data.data.application);

      // Refresh data
      queryClient.invalidateQueries(['pointsBalance']);
      queryClient.invalidateQueries(['allApplications']);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to unlock contact';
      alert(errorMsg);
      if (errorMsg.includes('No active package')) {
        navigate('/client/packages');
      }
    }
  };

  if (loadingApplications || loadingPoints) {
    return <Loading text="Loading applications..." />;
  }

  const applications = applicationsData?.data?.applications || [];
  const pointsRemaining = pointsData?.data?.pointsRemaining || 0;

  return (
    <div className="space-y-6">
      {/* Header with Points */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-600 mt-1">Review applications from students</p>
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

      {/* Applications List */}
      {applications.length === 0 ? (
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
          {applications.map((application) => (
            <Card key={application._id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Job Title and Status */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {application.jobPost?.title || 'Job Title'}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Applied by: {application.contactUnlockedByClient ? application.student?.name : 'Student (Locked)'}
                      </p>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>

                  {/* Application Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {application.proposedBudget && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Proposed Budget</p>
                          <p className="font-semibold text-green-600">${application.proposedBudget.amount}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Applied On</p>
                        <p className="font-semibold text-sm">{new Date(application.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {application.estimatedDuration && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-semibold text-sm">{application.estimatedDuration}</p>
                        </div>
                      </div>
                    )}
                    {application.proposalType && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-xs text-gray-500">Proposal</p>
                          <p className="font-semibold text-sm capitalize">{application.proposalType}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Approach Details */}
                  {application.approachSelections && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {application.approachSelections.methodology && <Badge variant="default">{application.approachSelections.methodology}</Badge>}
                      {application.approachSelections.deliveryFrequency && <Badge variant="default">{application.approachSelections.deliveryFrequency}</Badge>}
                      {application.availabilityCommitment && <Badge variant="default">{application.availabilityCommitment}</Badge>}
                      {application.relevantExperienceLevel && <Badge variant="info">{application.relevantExperienceLevel}</Badge>}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/client/jobs/${application.jobPost?._id}`)} disabled={!application.jobPost}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Job
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleViewStudent(application)}>
                  {application.contactUnlockedByClient ? (
                    <><Unlock className="w-4 h-4 mr-2" />View Details</>
                  ) : (
                    <><Lock className="w-4 h-4 mr-2" />Unlock (10 pts)</>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} title="Applicant Details" size="lg">
        {selectedApplication && (
          <div className="space-y-6">
            {selectedApplication.contactUnlockedByClient ? (
              <>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-3">Student Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-semibold">Name:</span> {selectedApplication.student?.name}</p>
                    <p><span className="font-semibold">Email:</span> {selectedApplication.student?.email}</p>
                    {selectedApplication.student?.studentProfile?.university && <p><span className="font-semibold">University:</span> {selectedApplication.student.studentProfile.university}</p>}
                    {selectedApplication.student?.studentProfile?.major && <p><span className="font-semibold">Major:</span> {selectedApplication.student.studentProfile.major}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3">Proposal Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-semibold">Proposed Budget:</span> ${selectedApplication.proposedBudget?.amount}</p>
                    <p><span className="font-semibold">Duration:</span> {selectedApplication.estimatedDuration}</p>
                    <p><span className="font-semibold">Methodology:</span> {selectedApplication.approachSelections?.methodology}</p>
                    <p><span className="font-semibold">Delivery:</span> {selectedApplication.approachSelections?.deliveryFrequency}</p>
                  </div>
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
