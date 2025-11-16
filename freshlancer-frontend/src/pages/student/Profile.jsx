import React, { useState } from 'react';
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
} from 'lucide-react';

const Profile = () => {
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Fetch user profile
  const { data: userData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => authService.getMe(),
  });

  const user = userData?.data?.user;
  const studentProfile = user?.studentProfile;

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
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {editMode ? 'Cancel' : 'Edit Profile'}
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

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
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
                      {studentProfile.hourlyRate.currency} ${studentProfile.hourlyRate.min} - $
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
          {studentProfile?.resume && studentProfile.resume.url && (
            <Card title="Resume / CV">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(studentProfile.resume.url, '_blank')}
                >
                  Download
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
