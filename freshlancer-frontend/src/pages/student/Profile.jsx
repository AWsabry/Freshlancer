import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Briefcase,
  Award,
  BookOpen,
  Code,
  Link as LinkIcon,
  FileText,
  Languages,
  DollarSign,
  CheckCircle,
  Clock,
  Edit,
  Save,
  Upload,
  Trash2,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/env';

const Profile = () => {
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  // Fetch user profile
  const { data: userData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => authService.getMe(),
  });

  const user = userData?.data?.user;
  const studentProfile = user?.studentProfile;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      setShowEditModal(false);
      reset();
      alert('Profile updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Handle opening edit modal and populating form
  const handleOpenEditModal = () => {
    if (user) {
      // Set form default values
      setValue('name', user.name || '');
      setValue('phone', user.phone || '');
      setValue('age', user.age || '');
      setValue('gender', user.gender || '');
      setValue('nationality', user.nationality || '');
      setValue('location.country', user.location?.country || '');
      setValue('location.city', user.location?.city || '');
      setValue('location.timezone', user.location?.timezone || '');

      if (studentProfile) {
        setValue('studentProfile.bio', studentProfile.bio || '');
        setValue('studentProfile.experienceLevel', studentProfile.experienceLevel || '');
        setValue('studentProfile.yearsOfExperience', studentProfile.yearsOfExperience || 0);
        setValue('studentProfile.availability', studentProfile.availability || 'Available');
        setValue('studentProfile.hourlyRate.min', studentProfile.hourlyRate?.min || '');
        setValue('studentProfile.hourlyRate.max', studentProfile.hourlyRate?.max || '');
        setValue('studentProfile.hourlyRate.currency', studentProfile.hourlyRate?.currency || 'Decide Your Currency');
        setValue('studentProfile.socialLinks.github', studentProfile.socialLinks?.github || '');
        setValue('studentProfile.socialLinks.linkedin', studentProfile.socialLinks?.linkedin || '');
        setValue('studentProfile.socialLinks.website', studentProfile.socialLinks?.website || '');
        setValue('studentProfile.socialLinks.behance', studentProfile.socialLinks?.behance || '');
      }
    }
    setShowEditModal(true);
  };

  // Handle form submission
  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  // Upload resume mutation
  const uploadResumeMutation = useMutation({
    mutationFn: (file) => authService.uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      setUploadingResume(false);
      alert('Resume uploaded successfully!');
    },
    onError: (error) => {
      setUploadingResume(false);
      alert(error.response?.data?.message || 'Failed to upload resume');
    },
  });

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: () => authService.deleteResume(),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      alert('Resume deleted successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete resume');
    },
  });

  // Handle resume file selection
  const handleResumeChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setUploadingResume(true);
      uploadResumeMutation.mutate(file);
    }
  };

  // Handle delete resume
  const handleDeleteResume = () => {
    if (window.confirm('Are you sure you want to delete your resume?')) {
      deleteResumeMutation.mutate();
    }
  };

  const getVerificationBadgeVariant = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <Loading text="Loading profile..." />;
  }

  if (!user) {
    return (
      <Alert type="error" message="Failed to load profile data" />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <img
              src={user.photo}
              alt={user.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
            />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                {studentProfile?.isVerified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </Badge>
                )}
                {studentProfile?.verificationStatus && !studentProfile?.isVerified && (
                  <Badge variant={getVerificationBadgeVariant(studentProfile.verificationStatus)}>
                    {studentProfile.verificationStatus}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-gray-600 mb-3">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
                {user.emailVerified && (
                  <Badge variant="info" size="sm">Email Verified</Badge>
                )}
              </div>
              {studentProfile?.bio && (
                <p className="text-gray-700 max-w-2xl">{studentProfile.bio}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditModal}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Details */}
          <Card title="Personal Information">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <p className="text-gray-900">{user.name}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>

              {user.phone && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
              )}

              {user.age && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    Age
                  </label>
                  <p className="text-gray-900">{user.age} years old</p>
                </div>
              )}

              {user.gender && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                    <User className="w-4 h-4" />
                    Gender
                  </label>
                  <p className="text-gray-900">{user.gender}</p>
                </div>
              )}

              {user.nationality && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                    <Globe className="w-4 h-4" />
                    Nationality
                  </label>
                  <p className="text-gray-900">{user.nationality}</p>
                </div>
              )}

              {user.location && (user.location.city || user.location.country) && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <p className="text-gray-900">
                    {[user.location.city, user.location.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {(user.joinedAt || user.createdAt) && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {new Date(user.joinedAt || user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Professional Info */}
          {studentProfile && (
            <Card title="Professional Details">
              <div className="space-y-4">
                {studentProfile.experienceLevel && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                      <Briefcase className="w-4 h-4" />
                      Experience Level
                    </label>
                    <Badge variant="info">{studentProfile.experienceLevel}</Badge>
                  </div>
                )}

                {studentProfile.yearsOfExperience !== undefined && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                      <Clock className="w-4 h-4" />
                      Years of Experience
                    </label>
                    <p className="text-gray-900">{studentProfile.yearsOfExperience} years</p>
                  </div>
                )}

                {studentProfile.availability && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                      <Clock className="w-4 h-4" />
                      Availability
                    </label>
                    <Badge
                      variant={
                        studentProfile.availability === 'Available'
                          ? 'success'
                          : studentProfile.availability === 'Busy'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {studentProfile.availability}
                    </Badge>
                  </div>
                )}

                {studentProfile.hourlyRate && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      Hourly Rate
                    </label>
                    <p className="text-gray-900">
                      {studentProfile.hourlyRate.currency} {studentProfile.hourlyRate.min} - 
                      {studentProfile.hourlyRate.max}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Skills, Education, etc. */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills */}
          {studentProfile?.skills && studentProfile.skills.length > 0 && (
            <Card title="Skills & Expertise">
              <div className="flex flex-wrap gap-3">
                {studentProfile.skills.map((skill, index) => (
                  <div key={index} className="flex flex-col">
                    <Badge variant="primary" className="mb-1">
                      {skill.name}
                    </Badge>
                    {skill.level && (
                      <span className="text-xs text-gray-500 text-center">{skill.level}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Education */}
          {studentProfile?.education && studentProfile.education.length > 0 && (
            <Card title="Education">
              <div className="space-y-4">
                {studentProfile.education.map((edu, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                        <p className="text-gray-700">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {edu.graduationYear && (
                          <Badge variant="secondary">{edu.graduationYear}</Badge>
                        )}
                        {edu.isCurrentlyStudying && (
                          <Badge variant="info" className="ml-2">Currently Studying</Badge>
                        )}
                      </div>
                    </div>
                    {edu.gpa && (
                      <p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Languages */}
          {studentProfile?.languages && studentProfile.languages.length > 0 && (
            <Card title="Languages">
              <div className="grid grid-cols-2 gap-4">
                {studentProfile.languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-900">{lang.language}</span>
                    <Badge variant="secondary">{lang.proficiency}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Certifications */}
          {studentProfile?.certifications && studentProfile.certifications.length > 0 && (
            <Card title="Certifications">
              <div className="space-y-4">
                {studentProfile.certifications.map((cert, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                        <p className="text-gray-700">{cert.issuingOrganization}</p>
                        {cert.credentialId && (
                          <p className="text-sm text-gray-600">ID: {cert.credentialId}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {cert.issueDate && (
                          <p>{new Date(cert.issueDate).toLocaleDateString()}</p>
                        )}
                        {cert.expirationDate && (
                          <p className="text-red-600">
                            Expires: {new Date(cert.expirationDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-2"
                      >
                        <LinkIcon className="w-4 h-4" />
                        View Credential
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Portfolio */}
          {studentProfile?.portfolio && studentProfile.portfolio.length > 0 && (
            <Card title="Portfolio">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentProfile.portfolio.map((project, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map((tech, techIndex) => (
                          <Badge key={techIndex} variant="secondary" size="sm">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <LinkIcon className="w-4 h-4" />
                        View Project
                      </a>
                    )}
                    {project.completedDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Completed: {new Date(project.completedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Social Links */}
          {studentProfile?.socialLinks && Object.values(studentProfile.socialLinks).some(link => link) && (
            <Card title="Social Links">
              <div className="grid grid-cols-2 gap-4">
                {studentProfile.socialLinks.github && (
                  <a
                    href={studentProfile.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                  >
                    <LinkIcon className="w-4 h-4" />
                    GitHub
                  </a>
                )}
                {studentProfile.socialLinks.linkedin && (
                  <a
                    href={studentProfile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                  >
                    <LinkIcon className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {studentProfile.socialLinks.website && (
                  <a
                    href={studentProfile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Website
                  </a>
                )}
                {studentProfile.socialLinks.behance && (
                  <a
                    href={studentProfile.socialLinks.behance}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Behance
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Resume */}
          <Card title="Resume / CV">
            {studentProfile?.resume && studentProfile.resume.url ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{studentProfile.resume.filename}</p>
                      {studentProfile.resume.uploadedAt && (
                        <p className="text-sm text-gray-600">
                          Uploaded: {new Date(studentProfile.resume.uploadedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                  onClick={() => window.open(`${API_BASE_URL}${studentProfile.resume.url}`, '_blank')}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteResume}
                      loading={deleteResumeMutation.isLoading}
                      disabled={deleteResumeMutation.isLoading}
                      className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    loading={uploadingResume}
                    disabled={uploadingResume}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Replace Resume
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No resume uploaded yet</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                  className="hidden"
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingResume}
                  disabled={uploadingResume}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  Upload Resume
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
                placeholder="Enter your full name"
              />

              <Input
                label="Phone"
                type="tel"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="Enter your phone number"
              />

              <Input
                label="Age"
                type="number"
                {...register('age', {
                  min: { value: 16, message: 'Must be at least 16 years old' },
                  max: { value: 100, message: 'Invalid age' }
                })}
                error={errors.age?.message}
                placeholder="Enter your age"
              />

              <Select
                label="Gender"
                {...register('gender')}
                error={errors.gender?.message}
                options={[
                  { value: '', label: 'Select gender' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                  { value: 'Prefer not to say', label: 'Prefer not to say' },
                ]}
              />

              <Input
                label="Nationality"
                {...register('nationality')}
                error={errors.nationality?.message}
                placeholder="Enter your nationality"
              />
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Country"
                {...register('location.country')}
                error={errors.location?.country?.message}
                placeholder="Enter your country"
              />

              <Input
                label="City"
                {...register('location.city')}
                error={errors.location?.city?.message}
                placeholder="Enter your city"
              />

              <Input
                label="Timezone"
                {...register('location.timezone')}
                error={errors.location?.timezone?.message}
                placeholder="e.g., UTC+3, EST"
              />
            </div>
          </div>

          {/* Professional Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  {...register('studentProfile.bio')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell us about yourself, your expertise, and what you're passionate about..."
                />
                {errors.studentProfile?.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.studentProfile.bio.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Experience Level"
                  {...register('studentProfile.experienceLevel')}
                  error={errors.studentProfile?.experienceLevel?.message}
                  options={[
                    { value: '', label: 'Select experience level' },
                    { value: 'Beginner', label: 'Beginner' },
                    { value: 'Intermediate', label: 'Intermediate' },
                    { value: 'Advanced', label: 'Advanced' },
                    { value: 'Expert', label: 'Expert' },
                  ]}
                />

                <Input
                  label="Years of Experience"
                  type="number"
                  {...register('studentProfile.yearsOfExperience', {
                    min: { value: 0, message: 'Cannot be negative' },
                    max: { value: 50, message: 'Invalid years' }
                  })}
                  error={errors.studentProfile?.yearsOfExperience?.message}
                  placeholder="0"
                />

                <Select
                  label="Availability"
                  {...register('studentProfile.availability')}
                  error={errors.studentProfile?.availability?.message}
                  options={[
                    { value: 'Available', label: 'Available' },
                    { value: 'Busy', label: 'Busy' },
                    { value: 'Not Available', label: 'Not Available' },
                  ]}
                />

                <Select
                  label="Currency"
                  {...register('studentProfile.hourlyRate.currency')}
                  error={errors.studentProfile?.hourlyRate?.currency?.message}
                  options={[
                    { value: 'USD', label: 'USD ($) - US Dollar' },
                    { value: 'EUR', label: 'EUR (€) - Euro' },
                    { value: 'EGP', label: 'EGP (£) - Egyptian Pound' },
                    { value: 'GBP', label: 'GBP (£) - British Pound' },
                    { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
                    { value: 'SAR', label: 'SAR (﷼) - Saudi Riyal' },
                    { value: 'QAR', label: 'QAR (﷼) - Qatari Riyal' },
                    { value: 'KWD', label: 'KWD (د.ك) - Kuwaiti Dinar' },
                    { value: 'BHD', label: 'BHD (.د.ب) - Bahraini Dinar' },
                    { value: 'OMR', label: 'OMR (﷼) - Omani Rial' },
                    { value: 'JOD', label: 'JOD (د.ا) - Jordanian Dinar' },
                    { value: 'LBP', label: 'LBP (ل.ل) - Lebanese Pound' },
                    { value: 'ILS', label: 'ILS (₪) - Israeli Shekel' },
                    { value: 'TRY', label: 'TRY (₺) - Turkish Lira' },
                    { value: 'ZAR', label: 'ZAR (R) - South African Rand' },
                    { value: 'MAD', label: 'MAD (د.م.) - Moroccan Dirham' },
                    { value: 'TND', label: 'TND (د.ت) - Tunisian Dinar' },
                    { value: 'DZD', label: 'DZD (د.ج) - Algerian Dinar' },
                    { value: 'NGN', label: 'NGN (₦) - Nigerian Naira' },
                    { value: 'KES', label: 'KES (KSh) - Kenyan Shilling' },
                    { value: 'GHS', label: 'GHS (₵) - Ghanaian Cedi' },
                    { value: 'UGX', label: 'UGX (USh) - Ugandan Shilling' },
                    { value: 'TZS', label: 'TZS (TSh) - Tanzanian Shilling' },
                    { value: 'ETB', label: 'ETB (Br) - Ethiopian Birr' },
                    { value: 'CHF', label: 'CHF (Fr) - Swiss Franc' },
                    { value: 'SEK', label: 'SEK (kr) - Swedish Krona' },
                    { value: 'NOK', label: 'NOK (kr) - Norwegian Krone' },
                    { value: 'DKK', label: 'DKK (kr) - Danish Krone' },
                    { value: 'PLN', label: 'PLN (zł) - Polish Zloty' },
                    { value: 'CZK', label: 'CZK (Kč) - Czech Koruna' },
                    { value: 'HUF', label: 'HUF (Ft) - Hungarian Forint' },
                    { value: 'RON', label: 'RON (lei) - Romanian Leu' },
                    { value: 'BGN', label: 'BGN (лв) - Bulgarian Lev' },
                    { value: 'HRK', label: 'HRK (kn) - Croatian Kuna' },
                    { value: 'RUB', label: 'RUB (₽) - Russian Ruble' },
                    { value: 'UAH', label: 'UAH (₴) - Ukrainian Hryvnia' },
                  ]}
                />

                <Input
                  label="Hourly Rate (Min)"
                  type="number"
                  {...register('studentProfile.hourlyRate.min', {
                    min: { value: 0, message: 'Cannot be negative' }
                  })}
                  error={errors.studentProfile?.hourlyRate?.min?.message}
                  placeholder="Minimum rate"
                />

                <Input
                  label="Hourly Rate (Max)"
                  type="number"
                  {...register('studentProfile.hourlyRate.max', {
                    min: { value: 0, message: 'Cannot be negative' }
                  })}
                  error={errors.studentProfile?.hourlyRate?.max?.message}
                  placeholder="Maximum rate"
                />
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="GitHub"
                {...register('studentProfile.socialLinks.github')}
                error={errors.studentProfile?.socialLinks?.github?.message}
                placeholder="https://github.com/username"
              />

              <Input
                label="LinkedIn"
                {...register('studentProfile.socialLinks.linkedin')}
                error={errors.studentProfile?.socialLinks?.linkedin?.message}
                placeholder="https://linkedin.com/in/username"
              />

              <Input
                label="Personal Website"
                {...register('studentProfile.socialLinks.website')}
                error={errors.studentProfile?.socialLinks?.website?.message}
                placeholder="https://yourwebsite.com"
              />

              <Input
                label="Behance"
                {...register('studentProfile.socialLinks.behance')}
                error={errors.studentProfile?.socialLinks?.behance?.message}
                placeholder="https://behance.net/username"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={updateProfileMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updateProfileMutation.isLoading}
              disabled={updateProfileMutation.isLoading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
