import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  Users as UsersIcon,
  Search,
  Filter,
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
  Building,
  Hash,
  AlertCircle,
} from 'lucide-react';

const Students = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState(searchParams.get('status') || '');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewAction, setReviewAction] = useState(''); // 'approve' or 'reject'

  const page = parseInt(searchParams.get('page') || '1');

  // Fetch students with verification documents
  const { data: studentsData, isLoading, error } = useQuery({
    queryKey: ['adminStudents', page, verificationFilter, searchTerm],
    queryFn: () =>
      adminService.getStudentsWithVerification({
        page,
        limit: 20,
        verificationStatus: verificationFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  // Approve verification mutation
  const approveMutation = useMutation({
    mutationFn: ({ documentId, adminNotes }) =>
      adminService.approveVerificationDocument(documentId, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminStudents']);
      setShowReviewModal(false);
      setSelectedDocument(null);
      setSelectedStudent(null);
      setAdminNotes('');
    },
  });

  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: ({ documentId, rejectionReason, adminNotes }) =>
      adminService.rejectVerificationDocument(documentId, rejectionReason, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminStudents']);
      setShowReviewModal(false);
      setSelectedDocument(null);
      setSelectedStudent(null);
      setRejectionReason('');
      setAdminNotes('');
    },
  });

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
    setSearchParams({ page: '1', status: verificationFilter });
  };

  const handleStatusFilter = (status) => {
    setVerificationFilter(status);
    setSearchParams({ page: '1', status });
  };

  const handleReview = (student, document, action) => {
    setSelectedStudent(student);
    setSelectedDocument(document);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (reviewAction === 'approve') {
      approveMutation.mutate({
        documentId: selectedDocument._id,
        adminNotes,
      });
    } else if (reviewAction === 'reject') {
      if (!rejectionReason.trim()) {
        alert('Please provide a rejection reason');
        return;
      }
      rejectMutation.mutate({
        documentId: selectedDocument._id,
        rejectionReason,
        adminNotes,
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { variant: 'success', label: 'Verified', icon: CheckCircle },
      pending: { variant: 'warning', label: 'Pending', icon: Clock },
      rejected: { variant: 'error', label: 'Rejected', icon: XCircle },
      unverified: { variant: 'default', label: 'Unverified', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.unverified;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1 inline" />
        {config.label}
      </Badge>
    );
  };

  const getDocumentTypeBadge = (type) => {
    const typeLabels = {
      student_id: 'Student ID',
      enrollment_certificate: 'Enrollment Certificate',
      transcript: 'Transcript',
      other: 'Other',
    };
    return typeLabels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const students = studentsData?.data?.students || [];
  const total = studentsData?.total || 0;
  const pages = studentsData?.pages || 1;

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Alert variant="error">Failed to load students: {error.message}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-8 h-8" />
            Student Verifications
          </h1>
          <p className="text-gray-600 mt-1">
            {total} student{total !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusFilter('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                verificationFilter === ''
                  ? 'bg-primary-600 text-[#8904aa]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Students
            </button>
            <button
              onClick={() => handleStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                verificationFilter === 'pending'
                  ? 'bg-primary-600 text-[#8904aa]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => handleStatusFilter('verified')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                verificationFilter === 'verified'
                  ? 'bg-primary-600 text-[#8904aa]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => handleStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                verificationFilter === 'rejected'
                  ? 'bg-primary-600 text-[#8904aa]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => handleStatusFilter('unverified')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                verificationFilter === 'unverified'
                  ? 'bg-primary-600 text-[#8904aa]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unverified
            </button>
          </div>
        </div>
      </Card>

      {/* Students List */}
      <div className="space-y-4">
        {students.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600">Try adjusting your search or filters.</p>
            </div>
          </Card>
        ) : (
          students.map((student) => (
            <Card key={student._id}>
              <div className="space-y-4">
                {/* Student Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold text-lg">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {getStatusBadge(student.studentProfile?.verificationStatus || 'unverified')}
                        <span className="text-xs text-gray-500">
                          Joined {formatDate(student.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Documents */}
                {student.verificationDocuments && student.verificationDocuments.length > 0 ? (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Verification Documents</h4>
                    <div className="space-y-3">
                      {student.verificationDocuments.map((doc) => (
                        <div
                          key={doc._id}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                  {getDocumentTypeBadge(doc.documentType)}
                                </span>
                                {getStatusBadge(doc.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{doc.fileName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                                </div>
                                {doc.institutionName && (
                                  <div className="flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    <span>{doc.institutionName}</span>
                                  </div>
                                )}
                                {doc.studentIdNumber && (
                                  <div className="flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    <span>{doc.studentIdNumber}</span>
                                  </div>
                                )}
                              </div>

                              {doc.rejectionReason && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="text-sm text-red-700">
                                    <strong>Rejection Reason:</strong> {doc.rejectionReason}
                                  </p>
                                </div>
                              )}

                              {doc.adminNotes && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-sm text-blue-700">
                                    <strong>Admin Notes:</strong> {doc.adminNotes}
                                  </p>
                                </div>
                              )}

                              {doc.reviewedAt && doc.reviewedBy && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Reviewed by {doc.reviewedBy.name} on {formatDate(doc.reviewedAt)}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View
                              </a>
                              {doc.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => handleReview(student, doc, 'approve')}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="error"
                                    onClick={() => handleReview(student, doc, 'reject')}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4 text-center text-gray-500">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm">No verification documents submitted yet</p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setSearchParams({ page: String(page - 1), status: verificationFilter })}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setSearchParams({ page: String(pageNum), status: verificationFilter })}
                className={`w-8 h-8 rounded ${
                  page === pageNum
                    ? 'bg-primary-600 text-[#8904aa]'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pages}
            onClick={() => setSearchParams({ page: String(page + 1), status: verificationFilter })}
          >
            Next
          </Button>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedDocument && selectedStudent && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedDocument(null);
            setSelectedStudent(null);
            setRejectionReason('');
            setAdminNotes('');
          }}
          title={`${reviewAction === 'approve' ? 'Approve' : 'Reject'} Verification Document`}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Student</p>
              <p className="font-medium">{selectedStudent.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Document Type</p>
              <p className="font-medium">{getDocumentTypeBadge(selectedDocument.documentType)}</p>
            </div>

            {reviewAction === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length}/500 characters
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any internal notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{adminNotes.length}/1000 characters</p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedDocument(null);
                  setSelectedStudent(null);
                  setRejectionReason('');
                  setAdminNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'approve' ? 'success' : 'error'}
                onClick={handleSubmitReview}
                disabled={approveMutation.isLoading || rejectMutation.isLoading}
              >
                {approveMutation.isLoading || rejectMutation.isLoading
                  ? 'Processing...'
                  : reviewAction === 'approve'
                  ? 'Approve Document'
                  : 'Reject Document'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Students;
