import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '../../services/profileService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Globe,
  Github,
  Linkedin,
  FileText,
  Download,
  Star,
  Clock,
  DollarSign,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

const StudentProfileView = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  // Fetch student profile
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['studentProfile', studentId],
    queryFn: () => profileService.getStudentProfile(studentId),
  });

  if (isLoading) {
    return <Loading text="Loading student profile..." />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert
          type="error"
          message={`Failed to load student profile: ${error.response?.data?.message || error.message}`}
        />
        <Button variant="secondary" onClick={() => navigate('/client/applications')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>
      </div>
    );
  }

  const student = profileData?.data?.student;

  if (!student) {
    return <Alert type="error" message="Student not found" />;
  }

  const profile = student.studentProfile || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/client/applications')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>
      </div>

      {/* Basic Information Card */}
      <Card>
        <div className="flex items-start gap-6">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-200">
                <User className="w-16 h-16 text-primary-600" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>

            {profile.bio && (
              <p className="text-gray-600 mb-4">{profile.bio}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-5 h-5 text-primary-600" />
                <span>{student.email}</span>
              </div>

              {student.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <span>{student.phone}</span>
                </div>
              )}

              {student.age && (
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-5 h-5 text-primary-600" />
                  <span>{student.age} years old</span>
                </div>
              )}

              {student.nationality && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Globe className="w-5 h-5 text-primary-600" />
                  <span>{student.nationality}</span>
                </div>
              )}

              {student.location?.city && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <span>
                    {student.location.city}
                    {student.location.country && `, ${student.location.country}`}
                  </span>
                </div>
              )}

              {profile.availability && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <Badge
                    variant={
                      profile.availability === 'Available'
                        ? 'success'
                        : profile.availability === 'Busy'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {profile.availability}
                  </Badge>
                </div>
              )}
            </div>

            {/* Social Links */}
            {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
              <div className="flex items-center gap-3 pt-4 border-t">
                <span className="font-semibold text-gray-700">Social Links:</span>
                {profile.socialLinks.github && (
                  <a
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                  >
                    <Github className="w-5 h-5" />
                    <span className="text-sm">GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                  >
                    <Linkedin className="w-5 h-5" />
                    <span className="text-sm">LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile.socialLinks.website && (
                  <a
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                  >
                    <Globe className="w-5 h-5" />
                    <span className="text-sm">Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile.socialLinks.behance && (
                  <a
                    href={profile.socialLinks.behance}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                  >
                    <Briefcase className="w-5 h-5" />
                    <span className="text-sm">Behance</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Resume/CV */}
      {profile.resume && profile.resume.url && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary-600" />
              <div>
                <h3 className="font-bold text-lg">Resume / CV</h3>
                <p className="text-sm text-gray-600">{profile.resume.filename || 'resume.pdf'}</p>
                {profile.resume.uploadedAt && (
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(profile.resume.uploadedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <a
              href={profile.resume.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Button variant="primary">
                <Download className="w-4 h-4 mr-2" />
                Download CV
              </Button>
            </a>
          </div>
        </Card>
      )}

      {/* Experience & Rate */}
      {(profile.experienceLevel || profile.hourlyRate) && (
        <Card>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-600" />
            Experience & Rate
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {profile.experienceLevel && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Experience Level</p>
                <Badge variant="info" className="text-base">
                  {profile.experienceLevel}
                </Badge>
              </div>
            )}
            {profile.yearsOfExperience !== undefined && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Years of Experience</p>
                <p className="font-bold text-lg">{profile.yearsOfExperience} years</p>
              </div>
            )}
            {profile.hourlyRate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Hourly Rate</p>
                <p className="font-bold text-lg text-green-600">
                  ${profile.hourlyRate.min} - ${profile.hourlyRate.max} {profile.hourlyRate.currency}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <Card>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Code className="w-6 h-6 text-primary-600" />
            Skills
          </h3>
          <div className="flex flex-wrap gap-3">
            {profile.skills.map((skill, index) => (
              <div key={index} className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
                <div className="font-semibold text-primary-900">{skill.name}</div>
                {skill.level && (
                  <div className="text-xs text-primary-600">{skill.level}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <Card>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary-600" />
            Education
          </h3>
          <div className="space-y-4">
            {profile.education.map((edu, index) => (
              <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                <h4 className="font-bold text-lg">{edu.degree}</h4>
                <p className="text-gray-700">{edu.institution}</p>
                <p className="text-gray-600">{edu.fieldOfStudy}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  {edu.graduationYear && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {edu.isCurrentlyStudying ? `Expected ${edu.graduationYear}` : edu.graduationYear}
                    </span>
                  )}
                  {edu.gpa && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      GPA: {edu.gpa}
                    </span>
                  )}
                  {edu.isCurrentlyStudying && (
                    <Badge variant="info">Currently Studying</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Portfolio */}
      {profile.portfolio && profile.portfolio.length > 0 && (
        <Card>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-600" />
            Portfolio
          </h3>
          <div className="grid gap-4">
            {profile.portfolio.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-2">{project.title}</h4>
                    <p className="text-gray-700 mb-3">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.map((tech, techIndex) => (
                          <Badge key={techIndex} variant="default">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.completedDate && (
                      <p className="text-sm text-gray-500">
                        Completed: {new Date(project.completedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Certifications */}
      {profile.certifications && profile.certifications.length > 0 && (
        <Card>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary-600" />
            Certifications
          </h3>
          <div className="space-y-4">
            {profile.certifications.map((cert, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{cert.name}</h4>
                    <p className="text-gray-700">{cert.issuingOrganization}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {cert.issueDate && (
                        <span>
                          Issued: {new Date(cert.issueDate).toLocaleDateString()}
                        </span>
                      )}
                      {cert.expirationDate && (
                        <span>
                          Expires: {new Date(cert.expirationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {cert.credentialId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Credential ID: {cert.credentialId}
                      </p>
                    )}
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Languages */}
      {profile.languages && profile.languages.length > 0 && (
        <Card>
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary-600" />
            Languages
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.languages.map((lang, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-gray-900">{lang.language}</p>
                <p className="text-sm text-gray-600">{lang.proficiency}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentProfileView;
