import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, Bell, Menu, X, LogOut, User, LayoutDashboard, 
  Trophy, Check, Trash2, Package, AlertCircle, DollarSign, MessageCircle 
} from 'lucide-react';
import notificationService from '../services/notificationService';
import chatService from '../services/chatService';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications periodically
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Poll every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Add chat notification check
const [unreadChats, setUnreadChats] = useState(0);

useEffect(() => {
  if (user) {
    fetchUnreadChats();
  }
}, [user]);

const fetchUnreadChats = async () => {
  const result = await chatService.getUnreadCount();
  if (result.success) {
    setUnreadChats(result.data);
  }
};

  const fetchNotifications = async () => {
    setLoading(true);
    const result = await notificationService.getNotifications();
    if (result.success) {
      setNotifications(result.data.data || []);
      setUnreadCount(result.data.unreadCount || 0);
    }
    setLoading(false);
  };

  const fetchUnreadCount = async () => {
    const result = await notificationService.getUnreadCount();
    if (result.success) {
      setUnreadCount(result.data.unreadCount || 0);
    }
  };

  const handleNotificationClick = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(id);
    fetchNotifications();
    fetchUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    fetchNotifications();
    fetchUnreadCount();
  };

  const handleDeleteNotification = async (id) => {
    await notificationService.deleteNotification(id);
    fetchNotifications();
    fetchUnreadCount();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_request':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'request_accepted':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'request_completed':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'donation_received':
        return <DollarSign className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Relief Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`font-medium transition ${
                isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className={`font-medium transition ${
                isActive('/dashboard') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/leaderboard"
              className={`font-medium transition ${
                isActive('/leaderboard') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Leaderboard
            </Link>
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={handleNotificationClick}
                    className="relative p-2 text-gray-700 hover:text-blue-600 transition rounded-lg hover:bg-gray-100"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Panel */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                          <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No notifications yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                              You'll see updates here
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {notifications.map((notification) => (
                              <div
                                key={notification._id}
                                className={`p-4 hover:bg-gray-50 transition ${
                                  !notification.isRead ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${
                                      !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {notification.message}
                                    </p>
                                    {notification.relatedRequest && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {notification.relatedRequest.title}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatTime(notification.createdAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {!notification.isRead && (
                                      <button
                                        onClick={() => handleMarkAsRead(notification._id)}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        title="Mark as read"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteNotification(notification._id)}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="p-3 border-t bg-gray-50 text-center">
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              // You can navigate to a full notifications page here
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.userType}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-700 hover:text-red-600 transition"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg ${
                isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg ${
                isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg ${
                isActive('/leaderboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              Leaderboard
            </Link>

            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setNotificationsOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700"
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <>
                <div className="border-t pt-3">
                  <p className="px-3 text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="px-3 text-xs text-gray-500 capitalize">{user.userType}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="border-t pt-3 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-center border border-blue-600 text-blue-600 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;