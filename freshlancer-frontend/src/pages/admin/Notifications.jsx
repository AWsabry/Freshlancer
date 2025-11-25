import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  Briefcase,
  FileText,
  Star,
  Shield,
  Calendar,
  ArrowRight,
} from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [page, setPage] = useState(1);
  const [expandedNotification, setExpandedNotification] = useState(null); // Track expanded notification

  // Get notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', filter, page],
    queryFn: () => {
      const params = { page, limit: 20 };
      if (filter === 'unread') params.isRead = false;
      if (filter === 'read') params.isRead = true;
      return notificationService.getMyNotifications(params);
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  // Get icon component based on notification icon type
  const getIconComponent = (iconType) => {
    const iconMap = {
      info: Info,
      success: CheckCircle,
      warning: AlertCircle,
      error: XCircle,
      message: MessageSquare,
      payment: DollarSign,
      job: Briefcase,
      contract: FileText,
      review: Star,
    };
    return iconMap[iconType] || Bell;
  };

  // Get icon color based on notification icon type
  const getIconColor = (iconType, priority) => {
    if (priority === 'urgent') return 'text-red-600 bg-red-100';
    if (priority === 'high') return 'text-orange-600 bg-orange-100';

    const colorMap = {
      info: 'text-blue-600 bg-blue-100',
      success: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100',
      message: 'text-purple-600 bg-purple-100',
      payment: 'text-green-600 bg-green-100',
      job: 'text-indigo-600 bg-indigo-100',
      contract: 'text-blue-600 bg-blue-100',
      review: 'text-yellow-600 bg-yellow-100',
    };
    return colorMap[iconType] || 'text-gray-600 bg-gray-100';
  };

  // Handle notification click - expand/collapse
  const handleNotificationClick = (notification) => {
    if (expandedNotification === notification._id) {
      // Collapse if already expanded
      setExpandedNotification(null);
    } else {
      // Expand and mark as read
      setExpandedNotification(notification._id);
      if (!notification.isRead) {
        markAsReadMutation.mutate(notification._id);
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const notifications = notificationsData?.data?.notifications || [];
  const total = notificationsData?.total || 0;
  const pages = notificationsData?.pages || 1;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {total} notification{total !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isLoading || filter === 'read'}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'unread'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'read'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Read
        </button>
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? "You don't have any notifications yet."
                  : filter === 'unread'
                  ? "You don't have any unread notifications."
                  : "You don't have any read notifications."}
              </p>
            </div>
          </Card>
        ) : (
          notifications.map((notification) => {
            const IconComponent = getIconComponent(notification.icon);
            const iconColorClass = getIconColor(notification.icon, notification.priority);
            const isExpanded = expandedNotification === notification._id;

            return (
              <div key={notification._id} className="space-y-2">
                {/* Collapsed View - Title Only */}
                <div
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    notification.isRead
                      ? 'bg-white border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  } ${isExpanded ? 'shadow-md' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconColorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Title and timestamp */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Priority badge (if urgent or high) */}
                  {notification.priority && notification.priority !== 'normal' && (
                    <Badge
                      variant={
                        notification.priority === 'urgent'
                          ? 'error'
                          : notification.priority === 'high'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {notification.priority}
                    </Badge>
                  )}
                </div>

                {/* Expanded View - Full Card */}
                {isExpanded && (
                  <Card className="ml-12 border-l-4 border-l-primary-500">
                    <div className="space-y-4">
                      {/* Message */}
                      <p className="text-gray-700">{notification.message}</p>

                      {/* Action button */}
                      {notification.actionUrl && (
                        <div>
                          <button
                            onClick={() => navigate(notification.actionUrl)}
                            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                          >
                            {notification.actionText || 'View Details'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this notification?')) {
                              deleteNotificationMutation.mutate(notification._id);
                              setExpandedNotification(null);
                            }
                          }}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 rounded ${
                  page === pageNum
                    ? 'bg-primary-600 text-white'
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
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
