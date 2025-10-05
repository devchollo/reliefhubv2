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
  Star
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { success, error } = useNotification();
  const [activeTab, setActiveTab] = useState('myRequests');
  const [myRequests, setMyRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
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

    if (myReqResult.success) setMyRequests(myReqResult.data);
    if (acceptedResult.success) setAcceptedRequests(acceptedResult.data);
    if (transResult.success) setTransactions(transResult.data);
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
    <div className="bg-white rounded-xl p-6 shadow-sm border">
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
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-700',
    accepted: 'bg-purple-100 text-purple-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Package}
              title="Total Requests"
              value={stats.totalRequests || 0}
              color="bg-blue-500"
              subtitle="Requests you've created"
            />
            <StatCard
              icon={Heart}
              title="Helped Others"
              value={stats.totalHelped || 0}
              color="bg-purple-500"
              subtitle="Requests you've fulfilled"
            />
            <StatCard
              icon={CheckCircle}
              title="Completed"
              value={stats.completed || 0}
              color="bg-green-500"
              subtitle="Successfully delivered"
            />
            <StatCard
              icon={Star}
              title="Rating"
              value={stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
              color="bg-yellow-500"
              subtitle={`From ${stats.totalRatings || 0} reviews`}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('myRequests')}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === 'myRequests'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Requests ({myRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('helping')}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === 'helping'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                I'm Helping ({acceptedRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Transactions ({transactions.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* My Requests Tab */}
            {activeTab === 'myRequests' && (
              <div className="space-y-4">
                {myRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>You haven't created any requests yet</p>
                  </div>
                ) : (
                  myRequests.map((request) => (
                    <div key={request._id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{request.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[request.status]}`}>
                            {request.status}
                          </span>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${urgencyColors[request.urgency]}`}>
                            {request.urgency}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span className="capitalize">{request.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location.barangay}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                        {request.acceptedBy && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{request.acceptedBy.name}</span>
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
                  ))
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
                  acceptedRequests.map((request) => (
                    <div key={request._id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{request.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          <p className="text-sm text-gray-500">Requester: {request.requester.name}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[request.status]}`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location.barangay}, {request.location.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>{request.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(request.acceptedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction._id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {transaction.request.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Type: <span className="capitalize font-medium">{transaction.type}</span></span>
                            <span>•</span>
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
                        <p>Donor: {transaction.donor.name}</p>
                        <p>Recipient: {transaction.recipient.name}</p>
                        <p>Date: {new Date(transaction.createdAt).toLocaleDateString()}</p>
                      </div>

                      {transaction.status === 'completed' && !transaction.confirmedAt && user._id === transaction.recipient._id && (
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