import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { verificationService } from '../../services/verificationService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { Upload, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const Verification = () => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Fetch verification status and history
  const { data, isLoading } = useQuery({
    queryKey: ['verifications'],
    queryFn: () => verificationService.getMyVerifications(),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (formData) => verificationService.uploadDocument(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['verifications']);
      queryClient.invalidateQueries(['verificationStatus']);
      reset();
      setSelectedFile(null);
      alert('Document uploaded successfully!');
    },
    onError: (error) => {
      alert(error.message || 'Failed to upload document');
    },
  });

  const onSubmit = (data) => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('documentType', data.documentType);
    formData.append('institutionName', data.institutionName);
    formData.append('studentIdNumber', data.studentIdNumber);
    formData.append('enrollmentYear', data.enrollmentYear);
    formData.append('expectedGraduationYear', data.expectedGraduationYear);

    uploadMutation.mutate(formData);
  };

  if (isLoading) {
    return <Loading text="Loading verification status..." />;
  }

  const verifications = data?.data?.verifications || [];
  const hasApprovedVerification = verifications.some(v => v.status === 'approved');
  const hasPendingVerification = verifications.some(v => v.status === 'pending');

  const documentTypeOptions = [
    { value: 'student_id', label: 'Student ID Card' },
    { value: 'enrollment_certificate', label: 'Enrollment Certificate' },
    { value: 'transcript', label: 'Official Transcript' },
    { value: 'other', label: 'Other' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Alert */}
      {hasApprovedVerification && (
        <Alert
          type="success"
          title="Verification Complete"
          message="Your student status has been verified. You can now apply for jobs!"
        />
      )}

      {hasPendingVerification && !hasApprovedVerification && (
        <Alert
          type="info"
          title="Verification Pending"
          message="Your verification is being reviewed by our admin team. This usually takes 24-48 hours."
        />
      )}

      {!hasApprovedVerification && !hasPendingVerification && (
        <Alert
          type="warning"
          title="Verification Required"
          message="Please submit your student verification documents to start applying for jobs."
        />
      )}

      {/* Upload Form */}
      {!hasApprovedVerification && (
        <Card title="Submit Verification Document">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select
              label="Document Type"
              options={documentTypeOptions}
              error={errors.documentType?.message}
              {...register('documentType', { required: 'Document type is required' })}
            />

            <Input
              label="Institution Name"
              placeholder="University of..."
              error={errors.institutionName?.message}
              {...register('institutionName', { required: 'Institution name is required' })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Student ID Number"
                placeholder="123456789"
                error={errors.studentIdNumber?.message}
                {...register('studentIdNumber', { required: 'Student ID is required' })}
              />

              <Input
                label="Enrollment Year"
                type="number"
                placeholder="2020"
                error={errors.enrollmentYear?.message}
                {...register('enrollmentYear', {
                  required: 'Enrollment year is required',
                  min: { value: 2000, message: 'Please enter a valid year' },
                })}
              />
            </div>

            <Input
              label="Expected Graduation Year"
              type="number"
              placeholder="2025"
              error={errors.expectedGraduationYear?.message}
              {...register('expectedGraduationYear', {
                required: 'Graduation year is required',
                min: { value: new Date().getFullYear(), message: 'Please enter a valid future year' },
              })}
            />

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, JPG, PNG up to 10MB
                  </p>
                  {selectedFile && (
                    <p className="text-sm text-primary-600 font-medium">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={uploadMutation.isPending}
              disabled={uploadMutation.isPending}
            >
              Submit for Verification
            </Button>
          </form>
        </Card>
      )}

      {/* Verification History */}
      {verifications.length > 0 && (
        <Card title="Verification History">
          <div className="space-y-4">
            {verifications.map((verification) => (
              <div
                key={verification._id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  {getStatusIcon(verification.status)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {verification.documentType?.replace('_', ' ')}
                      </h4>
                      {getStatusBadge(verification.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {verification.institutionName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {new Date(verification.createdAt).toLocaleDateString()}
                    </p>
                    {verification.status === 'rejected' && verification.rejectionReason && (
                      <Alert
                        type="error"
                        message={`Reason: ${verification.rejectionReason}`}
                        className="mt-2"
                      />
                    )}
                    {verification.status === 'approved' && verification.approvedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Approved: {new Date(verification.approvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Verification;
