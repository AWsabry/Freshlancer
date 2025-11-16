import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import {
  Users,
  Briefcase,
  FileText,
  UserCheck,
  Clock,
  TrendingUp,
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminService.getDashboardStats(),
  });

  if (isLoading) {
    return <Loading text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message={`Failed to load dashboard: ${error.response?.data?.message || error.message}`}
      />
    );
  }

  const stats = statsData?.data?.stats || {};
  const recentUsers = statsData?.data?.recentUsers || [];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Students',
      value: stats.totalStudents || 0,
      icon: UserCheck,
      color: 'bg-green-500',
      onClick: () => navigate('/admin/users?role=student'),
    },
    {
      title: 'Clients',
      value: stats.totalClients || 0,
      icon: Briefcase,
      color: 'bg-purple-500',
      onClick: () => navigate('/admin/users?role=client'),
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications || 0,
      icon: FileText,
      color: 'bg-orange-500',
      onClick: () => navigate('/admin/applications'),
    },
    {
      title: 'Total Jobs',
      value: stats.totalJobs || 0,
      icon: Briefcase,
      color: 'bg-indigo-500',
      onClick: () => navigate('/admin/jobs'),
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs || 0,
      icon: TrendingUp,
      color: 'bg-teal-500',
    },
    {
      title: 'Pending Applications',
      value: stats.pendingApplications || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      onClick: () => navigate('/admin/applications?status=pending'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of platform statistics and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className={`${stat.onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Users */}
      <Card title="Recent Users">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        user.role === 'student'
                          ? 'success'
                          : user.role === 'client'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
