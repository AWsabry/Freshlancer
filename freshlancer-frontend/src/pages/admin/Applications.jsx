import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import {
  FileText,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  Eye,
} from 'lucide-react';

const Applications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const page = parseInt(searchParams.get('page') || '1');

  // Fetch applications
  const { data: applicationsData, isLoading, error } = useQuery({
    queryKey: ['adminApplications', page, statusFilter],
    queryFn: () =>
      adminService.getAllApplications({
        page,
        limit: 20,
        status: statusFilter || undefined,
      }),
  });

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setSearchParams({ page: '1', status });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString(), status: statusFilter });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger',
      withdrawn: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (isLoading) {
    return <Loading text="Loading applications..." />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message={`Failed to load applications: ${error.response?.data?.message || error.message}`}
      />
    );
  }

  const applications = applicationsData?.data?.applications || [];
  const totalPages = applicationsData?.totalPages || 1;
  const currentPage = applicationsData?.currentPage || 1;
  const totalCount = applicationsData?.totalCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Applications Management
          </h1>
          <p className="text-gray-600 mt-1">
            Total: {totalCount} applications
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === '' ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'accepted' ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('accepted')}
          >
            Accepted
          </Button>
          <Button
            variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('rejected')}
          >
            Rejected
          </Button>
          <Button
            variant={statusFilter === 'withdrawn' ? 'primary' : 'outline'}
            onClick={() => handleStatusFilter('withdrawn')}
          >
            Withdrawn
          </Button>
        </div>
      </Card>

      {/* Applications Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Unlocked
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={application.student?.photo}
                        alt={application.student?.name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.student?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {application.student?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {application.jobPost?.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {application.jobPost?.category}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={application.jobPost?.client?.photo}
                        alt={application.jobPost?.client?.name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.jobPost?.client?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {application.jobPost?.client?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      ${application.proposedBudget?.amount || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {application.estimatedDuration}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {application.contactUnlockedByClient ? (
                      <Badge variant="success" size="sm">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">No</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Applications;
