import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, Briefcase, Users, Package } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Post New Job',
      description: 'Create a new job posting for students',
      icon: Plus,
      action: () => navigate('/client/jobs/new'),
      variant: 'primary',
    },
    {
      title: 'My Jobs',
      description: 'View and manage your job posts',
      icon: Briefcase,
      action: () => navigate('/client/jobs'),
      variant: 'secondary',
    },
    {
      title: 'Applications',
      description: 'Review student applications',
      icon: Users,
      action: () => navigate('/client/applications'),
      variant: 'secondary',
    },
    {
      title: 'Packages',
      description: 'Purchase points packages',
      icon: Package,
      action: () => navigate('/client/packages'),
      variant: 'secondary',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Dashboard</h1>
        <p className="text-gray-600">Manage your job postings and connect with talented students</p>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className="p-6 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
                onClick={action.action}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-4 rounded-full ${
                    action.variant === 'primary'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <Button
                    variant={action.variant}
                    size="sm"
                    className="w-full"
                  >
                    {action.title}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Getting Started">
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">1.</span>
              <span>Click "Post New Job" to create your first job posting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">2.</span>
              <span>Students will see your job and can apply with structured proposals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">3.</span>
              <span>Review applications and hire the best talent for your projects</span>
            </li>
          </ul>
        </Card>

        <Card title="Platform Benefits">
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Access to talented student freelancers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Structured application process</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Cost-effective solutions for your projects</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Easy job management and tracking</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
