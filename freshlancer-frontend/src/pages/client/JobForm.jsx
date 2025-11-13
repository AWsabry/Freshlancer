import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { jobService } from '../../services/jobService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { ArrowLeft, Plus, X } from 'lucide-react';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      skillsRequired: [],
    },
  });

  const [skills, setSkills] = React.useState([]);
  const [newSkill, setNewSkill] = React.useState('');

  // Fetch job if editing
  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id),
    enabled: isEditing,
    onSuccess: (data) => {
      const job = data.data.jobPost;
      setSkills(job.skillsRequired || []);
      Object.keys(job).forEach((key) => {
        if (key === 'budget') {
          setValue('budgetMin', job.budget?.min);
          setValue('budgetMax', job.budget?.max);
        } else if (key === 'deadline') {
          // Convert deadline to YYYY-MM-DD format for date input
          const date = new Date(job.deadline);
          const formattedDate = date.toISOString().split('T')[0];
          setValue('deadline', formattedDate);
        } else if (key !== 'skillsRequired') {
          setValue(key, job[key]);
        }
      });
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (jobData) =>
      isEditing ? jobService.updateJob(id, jobData) : jobService.createJob(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      queryClient.invalidateQueries(['myJobs']);
      alert(isEditing ? 'Job updated successfully!' : 'Job posted successfully!');
      navigate('/client/jobs');
    },
    onError: (error) => {
      alert(error.message || `Failed to ${isEditing ? 'update' : 'create'} job`);
    },
  });

  const onSubmit = (data) => {
    // Validate skills
    if (skills.length === 0) {
      alert('Please add at least one required skill');
      return;
    }

    if (skills.length > 10) {
      alert('Maximum 10 skills allowed');
      return;
    }

    const jobData = {
      title: data.title,
      description: data.description,
      category: data.category,
      skillsRequired: skills,
      budget: {
        min: parseFloat(data.budgetMin),
        max: parseFloat(data.budgetMax),
        currency: 'USD',
      },
      projectDuration: data.projectDuration,
      deadline: data.deadline,
      experienceLevel: data.experienceLevel,
      applicationType: data.applicationType || 'open',
    };

    saveMutation.mutate(jobData);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  if (isLoading) {
    return <Loading text="Loading job..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/client/jobs')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to My Jobs
      </button>

      <Card title={isEditing ? 'Edit Job Post' : 'Create New Job Post'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Alert
            type="info"
            message="Fill in all required fields to post your job. Students will be able to browse and apply."
          />

          <Input
            label="Job Title"
            placeholder="e.g., Full-Stack Web Developer"
            error={errors.title?.message}
            {...register('title', { required: 'Title is required' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="6"
              placeholder="Describe the project, requirements, deliverables..."
              className="input"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <Select
            label="Category"
            options={[
              { value: '', label: 'Select category' },
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
            ]}
            error={errors.category?.message}
            {...register('category', { required: 'Category is required' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills Required
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill (e.g., React, Node.js)"
                className="input flex-1"
              />
              <Button type="button" variant="primary" onClick={addSkill}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Minimum Budget (USD)"
              type="number"
              min="0"
              step="0.01"
              error={errors.budgetMin?.message}
              {...register('budgetMin', {
                required: 'Min budget is required',
                min: { value: 0, message: 'Budget must be positive' },
              })}
            />

            <Input
              label="Maximum Budget (USD)"
              type="number"
              min="0"
              step="0.01"
              error={errors.budgetMax?.message}
              {...register('budgetMax', {
                required: 'Max budget is required',
                validate: (value) =>
                  parseFloat(value) >= parseFloat(watch('budgetMin')) ||
                  'Max budget must be greater than min',
              })}
            />
          </div>

          <Select
            label="Project Duration"
            options={[
              { value: '', label: 'Select duration' },
              { value: 'Less than 1 week', label: 'Less than 1 week' },
              { value: '1-2 weeks', label: '1-2 weeks' },
              { value: '2-4 weeks', label: '2-4 weeks' },
              { value: '1-3 months', label: '1-3 months' },
              { value: 'More than 3 months', label: 'More than 3 months' },
            ]}
            error={errors.projectDuration?.message}
            {...register('projectDuration', { required: 'Project duration is required' })}
          />

          <Input
            label="Deadline"
            type="date"
            error={errors.deadline?.message}
            {...register('deadline', {
              required: 'Deadline is required',
              validate: (value) => {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selectedDate > today || 'Deadline must be in the future';
              },
            })}
          />

          <Select
            label="Experience Level"
            options={[
              { value: '', label: 'Select experience level' },
              { value: 'Beginner', label: 'Beginner' },
              { value: 'Intermediate', label: 'Intermediate' },
              { value: 'Advanced', label: 'Advanced' },
            ]}
            error={errors.experienceLevel?.message}
            {...register('experienceLevel', { required: 'Experience level is required' })}
          />

          <Select
            label="Application Type"
            options={[
              { value: 'open', label: 'Open to All Students' },
              { value: 'invite-only', label: 'Invite Only' },
            ]}
            {...register('applicationType')}
          />

          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/client/jobs')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saveMutation.isPending}
              disabled={saveMutation.isPending}
              className="flex-1"
            >
              {isEditing ? 'Update Job' : 'Post Job'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default JobForm;
