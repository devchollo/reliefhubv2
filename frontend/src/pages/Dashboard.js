import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import requestService from '../services/requestService';
import transactionService from '../services/transactionService';
import {
  Package,
  Heart,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  AlertCircle,
  Star,
  Droplets,
  Home as HomeIcon,
  Shirt,
  Pill,
  DollarSign
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { success, error } = useNotification();
  const [activeTab, setActiveTab] = useState('myRequests');
  const [myRequests, setMyRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    const [myReqResult, acceptedResult, transResult, statsResult] = await Promise.all([
      requestService.getMyRequests(),
      requestService.getAcceptedRequests(),
      transactionService.getMyTransactions(),
      transactionService.getStats()
    ]);

    if (myReqResult.success) {
      const allMyRequests = myReqResult.data || [];
      // Filter out completed requests for "My Requests" tab
      setMyRequests(allMyRequests.filter(r => r.status !== 'completed'));
      // Separate completed requests
      setCompletedRequests(allMyRequests.filter(r => r.status === 'completed'));
    }
    
    if (acceptedResult.success) setAcceptedRequests(acceptedResult.data || []);
    if (transResult.success) setTransactions(transResult.data || []);
    if (statsResult.success) setStats(statsResult.data);

    setLoading(false);
  };

  const handleCompleteRequest = async (requestId) => {
    const result = await requestService.completeRequest(requestId, {
      notes: 'Request completed successfully'
    });

    if (result.success) {
      success('Request marked as completed!');
      fetchDashboardData();
    } else {
      error(result.error);
    }
  };

  const handleConfirmDelivery = async (transactionId) => {
    const result = await transactionService.confirmDelivery(transactionId, {
      receivedAt: new Date(),
      notes: 'Items received in good condition'
    });

    if (result.success) {
      success('Delivery confirmed!');
      fetchDashboardData();
    } else {
      error(result.error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const urgencyColors = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-700 border-blue-200',
    pending: 'bg-blue-100 text-blue-700 border-blue-200',
    accepted: 'bg-purple-100 text-purple-700 border-purple-200',
    'in-progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  };

  const typeIcons = {
    food: Package,
    water: Droplets,
    shelter: HomeIcon,
    clothing: Shirt,
    medical: Pill,
    money: DollarSign,
    other: AlertCircle
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Package}
            title="Active Requests"
            value={myRequests.length}
            color="bg-blue-500"
            subtitle="Ongoing requests"
          />
          <StatCard
            icon={Heart}
            title="Helping Others"
            value={acceptedRequests.length}
            color="bg-purple-500"
            subtitle="Requests you're fulfilling"
          />
          <StatCard
            icon={CheckCircle}
            title="Completed"
            value={completedRequests.length}
            color="bg-green-500"
            subtitle="Successfully delivered"
          />
          <StatCard
            icon={Star}
            title="Impact Score"
            value={user.totalHelps || 0}
            color="bg-yellow-500"
            subtitle="People helped"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="border-b">
            <div className="flex overflow-x-auto space-x-8 px-6">
              <button
                onClick={() => setActiveTab('myRequests')}
                className={`py-4 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'myRequests'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Active Requests ({myRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('helping')}
                className={`py-4 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'helping'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                I'm Helping ({acceptedRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-4 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'completed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Completed ({completedRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Transactions ({transactions.length})
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {/* My Requests Tab */}
            {activeTab === 'myRequests' && (
              <div className="space-y-4">
                {myRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No active requests</p>
                    <p className="text-sm mt-1">All your requests have been completed</p>
                  </div>
                ) : (
                  myRequests.map((request) => {
                    const TypeIcon = typeIcons[request.type] || AlertCircle;
                    return (
                      <div key={request._id} className="border rounded-lg p-4 hover:shadow-md transition bg-white">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <TypeIcon className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{request.title}</h3>
                                <p className="text-xs text-gray-500 capitalize">{request.type}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium border ${statusColors[request.status]}`}>
                              {request.status}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium border ${urgencyColors[request.urgency]}`}>
                              {request.urgency}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 flex-shrink-0" />
                            <span className="capitalize truncate">{request.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{request.location?.barangay || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                          {(request.acceptedBy || request.volunteer) && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{request.acceptedBy?.name || request.volunteer?.name || 'Volunteer'}</span>
                            </div>
                          )}
                        </div>

                        {request.status === 'in-progress' && (
                          <button
                            onClick={() => handleCompleteRequest(request._id)}
                            className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* I'm Helping Tab */}
            {activeTab === 'helping' && (
              <div className="space-y-4">
                {acceptedRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>You're not helping with any requests yet</p>
                  </div>
                ) : (
                  acceptedRequests.map((request) => {
                    const TypeIcon = typeIcons[request.type] || AlertCircle;
                    return (
                      <div key={request._id} className="border rounded-lg p-4 hover:shadow-md transition bg-white">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-purple-50 rounded-lg">
                                <TypeIcon className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{request.title}</h3>
                                <p className="text-sm text-gray-500">Requester: {request.requester?.name}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium border ${statusColors[request.status]}`}>
                            {request.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {request.location?.barangay}, {request.location?.city || 'Cebu'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate capitalize">{request.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{new Date(request.acceptedAt || request.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Completed Tab - NEW */}
            {activeTab === 'completed' && (
              <div className="space-y-4">
                {completedRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No completed requests yet</p>
                    <p className="text-sm mt-1">Your completed requests will appear here</p>
                  </div>
                ) : (
                  completedRequests.map((request) => {
                    const TypeIcon = typeIcons[request.type] || AlertCircle;
                    return (
                      <div key={request._id} className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <TypeIcon className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{request.title}</h3>
                                <p className="text-xs text-gray-500 capitalize">{request.type}</p>
                              </div>
                              <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium border ${statusColors[request.status]}`}>
                              {request.status}
                            </span>
                            {request.completedAt && (
                              <span className="text-xs text-gray-500">
                                {new Date(request.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{request.location?.barangay || 'N/A'}</span>
                          </div>
                          {(request.acceptedBy || request.volunteer) && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                Helped by: {request.acceptedBy?.name || request.volunteer?.name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Created: {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {request.completedAt && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
                              <span className="truncate">
                                Done: {new Date(request.completedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction._id} className="border rounded-lg p-4 hover:shadow-md transition bg-white">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {transaction.request?.title || 'Transaction'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-600">
                            <span>Type: <span className="capitalize font-medium">{transaction.type || 'donation'}</span></span>
                            <span className="hidden md:inline">•</span>
                            <span>Status: <span className="capitalize font-medium">{transaction.status}</span></span>
                          </div>
                        </div>
                        {transaction.rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-medium">{transaction.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        {transaction.donor && <p>Donor: {transaction.donor.name}</p>}
                        {transaction.recipient && <p>Recipient: {transaction.recipient.name}</p>}
                        <p>Date: {new Date(transaction.createdAt).toLocaleDateString()}</p>
                        {transaction.amount && (
                          <p className="font-semibold text-green-600">Amount: ₱{transaction.amount.toLocaleString()}</p>
                        )}
                      </div>

                      {transaction.status === 'completed' && !transaction.confirmedAt && user._id === transaction.recipient?._id && (
                        <button
                          onClick={() => handleConfirmDelivery(transaction._id)}
                          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Confirm Delivery
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;