import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Alert from '../components/common/Alert';

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        role: data.role,
      };

      // Add role-specific fields
      if (data.role === 'student') {
        userData.studentProfile = {
          university: data.university,
          major: data.major,
          graduationYear: parseInt(data.graduationYear),
        };
      } else if (data.role === 'client') {
        userData.clientProfile = {
          companyName: data.companyName,
          industry: data.industry,
        };
      }

      const response = await registerUser(userData);

      // Redirect to dashboard based on role
      const user = response.data.user;
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'client') {
        navigate('/client/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student - Looking for work' },
    { value: 'client', label: 'Client - Hiring students' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Freshlancer today
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} />
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Full Name"
                placeholder="John Doe"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.passwordConfirm?.message}
              {...register('passwordConfirm', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
            />

            <div className="md:col-span-2">
              <Select
                label="I am a..."
                options={roleOptions}
                error={errors.role?.message}
                {...register('role', { required: 'Please select your role' })}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            {watch('role') === 'student' && (
              <>
                <Input
                  label="University"
                  placeholder="University of..."
                  error={errors.university?.message}
                  {...register('university', { required: 'University is required' })}
                />

                <Input
                  label="Major"
                  placeholder="Computer Science"
                  error={errors.major?.message}
                  {...register('major', { required: 'Major is required' })}
                />

                <Input
                  label="Expected Graduation Year"
                  type="number"
                  placeholder="2025"
                  error={errors.graduationYear?.message}
                  {...register('graduationYear', {
                    required: 'Graduation year is required',
                    min: {
                      value: new Date().getFullYear(),
                      message: 'Please enter a valid year',
                    },
                  })}
                />
              </>
            )}

            {watch('role') === 'client' && (
              <>
                <Input
                  label="Company Name"
                  placeholder="Acme Inc."
                  error={errors.companyName?.message}
                  {...register('companyName', { required: 'Company name is required' })}
                />

                <Input
                  label="Industry"
                  placeholder="Technology"
                  error={errors.industry?.message}
                  {...register('industry', { required: 'Industry is required' })}
                />
              </>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
