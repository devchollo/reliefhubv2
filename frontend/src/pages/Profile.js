// ============================================
// frontend/src/pages/Profile.js - NEW
// ============================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  User, Mail, Phone, MapPin, Award, Heart, Package,
  Star, Trophy, Calendar, Shield, MessageCircle, Edit
} from 'lucide-react';
import api from '../config/api';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { error } = useNotification();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  const isOwnProfile = !userId || userId === currentUser._id;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const targetId = userId || currentUser._id;
      const response = await api.get(`/profile/${targetId}`);
      setProfile(response.data.data);
      setReviews(response.data.data.reviews || []);
    } catch (err) {
      console.error('Error fetching profile:', err);
      error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  const stats = profile.stats || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Cover Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-4">
              <div className="flex items-end gap-4">
                {/* Profile Image */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {profile.profileImage ? (
                      <img src={profile.profileImage} alt={profile.name} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      profile.name.charAt(0)
                    )}
                  </div>
                  {profile.leaderboardRank <= 3 && (
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Name & Type */}
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-gray-600 capitalize flex items-center gap-2 mt-1">
                    <Shield className="w-4 h-4" />
                    {profile.userType}
                  </p>
                  {profile.leaderboardRank && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      #{profile.leaderboardRank} on Leaderboard
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 md:mt-0">
                {isOwnProfile ? (
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/chat/${profile._id}`)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message
                  </button>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatCard
                icon={Heart}
                label="People Helped"
                value={stats.totalHelped || 0}
                color="text-red-600 bg-red-50"
              />
              <StatCard
                icon={Package}
                label="Completed"
                value={stats.completedRequests || 0}
                color="text-green-600 bg-green-50"
              />
              <StatCard
                icon={Star}
                label="Rating"
                value={stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                color="text-yellow-600 bg-yellow-50"
              />
              <StatCard
                icon={Trophy}
                label="Points"
                value={stats.points || 0}
                color="text-purple-600 bg-purple-50"
              />
            </div>

            {/* Badges */}
            {profile.badges && profile.badges.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((badge, idx) => (
                    <div key={idx} className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-medium flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {badge.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b">
            <div className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 font-medium transition border-b-2 ${
                  activeTab === 'about'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 font-medium transition border-b-2 flex items-center gap-2 ${
                  activeTab === 'reviews'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Reviews ({stats.totalReviews || 0})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* Bio */}
                {profile.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Bio</h3>
                    <p className="text-gray-600">{profile.bio}</p>
                  </div>
                )}

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    {profile.email && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-5 h-5 text-green-600" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.address && (
                      <div className="flex items-start gap-3 text-gray-600">
                        <MapPin className="w-5 h-5 text-red-600 mt-1" />
                        <div>
                          {profile.address.street && <p>{profile.address.street}</p>}
                          <p>{profile.address.barangay}, {profile.address.city}</p>
                          {profile.address.province && <p>{profile.address.province}</p>}
                        </div>
                      </div>
                    )}
                    {!profile.email && !profile.phone && !profile.address && (
                      <p className="text-gray-500 italic">Contact information not shared publicly</p>
                    )}
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet</p>
                    <p className="text-sm text-gray-500 mt-1">Reviews will appear here after completed requests</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
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

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
  </div>
);

const ReviewCard = ({ review }) => (
  <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
          {review.reviewer.profileImage ? (
            <img src={review.reviewer.profileImage} alt={review.reviewer.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            review.reviewer.name.charAt(0)
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{review.reviewer.name}</p>
          <p className="text-xs text-gray-500 capitalize">{review.reviewer.userType}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
    {review.comment && (
      <p className="text-gray-700 mb-2">{review.comment}</p>
    )}
    {review.request && (
      <p className="text-sm text-gray-500">
        Request: <span className="text-blue-600">{review.request.title}</span>
      </p>
    )}
    <p className="text-xs text-gray-400 mt-2">
      {new Date(review.createdAt).toLocaleDateString()}
    </p>
  </div>
);

export default Profile;