// ============================================
// frontend/src/pages/Dashboard.js - COMPLETE FIXED VERSION
// ============================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Package, Clock, CheckCircle, XCircle, MapPin, Calendar,
  Trash2, Edit, MessageCircle, Star, Heart, Award, X, Save
} from 'lucide-react';
import requestService from '../services/requestService';
import profileService from '../services/profileService';

const Dashboard = () => {
  const { user } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  
  const [myRequests, setMyRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('my-requests');
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const [myReqs, accReqs] = await Promise.all([
      requestService.getMyRequests(),
      requestService.getAcceptedRequests()
    ]);

    if (myReqs.success) setMyRequests(myReqs.data || []);
    if (accReqs.success) setAcceptedRequests(accReqs.data || []);

    setLoading(false);
  };

  const handleMarkComplete = async (requestId) => {
    // Volunteer marks as complete - needs requester confirmation
    const result = await requestService.markComplete(requestId);
    if (result.success) {
      success('Marked as complete! Waiting for requester confirmation.');
      fetchDashboardData();
    } else {
      error(result.error);
    }
  };

  const handleConfirmComplete = async (requestId) => {
    // Requester confirms completion
    const result = await requestService.confirmComplete(requestId);
    if (result.success) {
      success('Request completed successfully!');
      fetchDashboardData();
    } else {
      error(result.error);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    const result = await requestService.deleteRequest(requestId);
    if (result.success) {
      success('Request cancelled successfully');
      fetchDashboardData();
    } else {
      error(result.error);
    }
  };

  const openEditModal = (request) => {
    setSelectedRequest(request);
    setShowEditModal(true);
  };

  const openReviewModal = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  // Separate requests by status
  const openRequests = myRequests.filter(r => r.status === 'open' || r.status === 'pending');
  const inProgressRequests = myRequests.filter(r => r.status === 'in-progress' || r.status === 'accepted');
  const completedMyRequests = myRequests.filter(r => r.status === 'completed');

  const inProgressVolunteer = acceptedRequests.filter(r => r.status === 'in-progress' || r.status === 'accepted');
  const completedVolunteer = acceptedRequests.filter(r => r.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your requests and help activities</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b">
            <div className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('my-requests')}
                className={`py-4 font-medium transition border-b-2 ${
                  activeTab === 'my-requests'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                My Requests ({myRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('helping')}
                className={`py-4 font-medium transition border-b-2 ${
                  activeTab === 'helping'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Helping Others ({acceptedRequests.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'my-requests' && (
              <div className="space-y-8">
                {/* Open Requests */}
                {openRequests.length > 0 && (
                  <Section title="Open" count={openRequests.length} color="blue">
                    {openRequests.map(req => (
                      <RequestCard
                        key={req._id}
                        request={req}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        showActions
                        isOwner
                      />
                    ))}
                  </Section>
                )}

                {/* In Progress */}
                {inProgressRequests.length > 0 && (
                  <Section title="In Progress" count={inProgressRequests.length} color="yellow">
                    {inProgressRequests.map(req => (
                      <RequestCard
                        key={req._id}
                        request={req}
                        onConfirmComplete={req.markedCompleteAt ? handleConfirmComplete : null}
                        onDelete={handleDelete}
                        showVolunteer
                        showChat
                        isOwner
                        needsConfirmation={!!req.markedCompleteAt}
                      />
                    ))}
                  </Section>
                )}

                {/* Completed */}
                {completedMyRequests.length > 0 && (
                  <Section title="Completed" count={completedMyRequests.length} color="green">
                    {completedMyRequests.map(req => (
                      <RequestCard
                        key={req._id}
                        request={req}
                        onReview={openReviewModal}
                        showVolunteer
                        showChat
                        isOwner
                        isCompleted
                      />
                    ))}
                  </Section>
                )}

                {myRequests.length === 0 && (
                  <EmptyState message="You haven't created any requests yet" />
                )}
              </div>
            )}

            {activeTab === 'helping' && (
              <div className="space-y-8">
                {/* In Progress */}
                {inProgressVolunteer.length > 0 && (
                  <Section title="In Progress" count={inProgressVolunteer.length} color="yellow">
                    {inProgressVolunteer.map(req => (
                      <RequestCard
                        key={req._id}
                        request={req}
                        onMarkComplete={handleMarkComplete}
                        showRequester
                        showChat
                        isVolunteer
                      />
                    ))}
                  </Section>
                )}

                {/* Completed */}
                {completedVolunteer.length > 0 && (
                  <Section title="Completed" count={completedVolunteer.length} color="green">
                    {completedVolunteer.map(req => (
                      <RequestCard
                        key={req._id}
                        request={req}
                        showRequester
                        showChat
                        isVolunteer
                        isCompleted
                      />
                    ))}
                  </Section>
                )}

                {acceptedRequests.length === 0 && (
                  <EmptyState message="You're not helping with any requests yet" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedRequest && (
        <EditRequestModal
          request={selectedRequest}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRequest(null);
            success('Request updated successfully!');
            fetchDashboardData();
          }}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
            success('Review submitted successfully!');
          }}
        />
      )}
    </div>
  );
};

const Section = ({ title, count, color, children }) => {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    green: 'text-green-600 bg-green-50'
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[color]}`}>
          {count}
        </span>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

const RequestCard = ({
  request,
  onEdit,
  onDelete,
  onMarkComplete,
  onConfirmComplete,
  onReview,
  showActions,
  showVolunteer,
  showRequester,
  showChat,
  isOwner,
  isVolunteer,
  isCompleted,
  needsConfirmation
}) => {
  const navigate = useNavigate();

  const statusColors = {
    open: 'text-blue-600 bg-blue-50 border-blue-200',
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'in-progress': 'text-orange-600 bg-orange-50 border-orange-200',
    accepted: 'text-purple-600 bg-purple-50 border-purple-200',
    completed: 'text-green-600 bg-green-50 border-green-200',
    cancelled: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{request.title}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium border ${statusColors[request.status]}`}>
          {request.status.replace('-', ' ')}
        </span>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4" />
          <span className="capitalize">{request.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{request.location?.barangay || 'Location'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{new Date(request.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Volunteer Info */}
      {showVolunteer && request.volunteer && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {request.volunteer.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Helped by {request.volunteer.name}</p>
            {request.volunteer.phone && (
              <p className="text-xs text-gray-600">{request.volunteer.phone}</p>
            )}
          </div>
        </div>
      )}

      {/* Requester Info */}
      {showRequester && request.requester && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-purple-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
            {request.requester.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Requested by {request.requester.name}</p>
            {request.requester.phone && (
              <p className="text-xs text-gray-600">{request.requester.phone}</p>
            )}
          </div>
        </div>
      )}

      {/* Needs Confirmation Alert */}
      {needsConfirmation && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ Volunteer marked this as complete. Please confirm if you received the help.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {showChat && request.volunteer && (
          <button
            onClick={() => navigate(`/chat/${request._id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
        )}

        {needsConfirmation && onConfirmComplete && (
          <button
            onClick={() => onConfirmComplete(request._id)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Completion
          </button>
        )}

        {!isCompleted && !needsConfirmation && onMarkComplete && isVolunteer && (
          <button
            onClick={() => onMarkComplete(request._id)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Complete
          </button>
        )}

        {isCompleted && onReview && request.volunteer && (
          <button
            onClick={() => onReview(request)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
          >
            <Star className="w-4 h-4" />
            Leave Review
          </button>
        )}

        {showActions && !isCompleted && (
          <>
            <button
              onClick={() => onEdit(request)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(request._id)}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="text-center py-12">
    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <p className="text-gray-600">{message}</p>
  </div>
);

const EditRequestModal = ({ request, onClose, onSuccess }) => {
  const { error } = useNotification();
  const [formData, setFormData] = useState({
    title: request.title,
    description: request.description,
    urgency: request.urgency,
    quantity: request.quantity || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await requestService.updateRequest(request._id, formData);

    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      error(result.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Edit Request</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
              <input
                type="text"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10 items"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReviewModal = ({ request, onClose, onSuccess }) => {
  const { error } = useNotification();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await profileService.createReview({
      revieweeId: request.volunteer._id,
      requestId: request._id,
      rating,
      comment
    });

    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      error(result.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Leave a Review</h3>
        
        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {request.volunteer.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{request.volunteer.name}</p>
              <p className="text-sm text-gray-600">Helped with: {request.title}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your experience..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length}/500</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;