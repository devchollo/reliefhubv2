// ============================================
// frontend/src/pages/Settings.js - NEW
// ============================================
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  User, Mail, Phone, MapPin, Lock, Image, Eye, EyeOff,
  Save, Camera, Shield
} from 'lucide-react';
import api from '../config/api';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile form
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    bio: user.bio || '',
    profileImage: user.profileImage || '',
    address: {
      street: user.address?.street || '',
      barangay: user.address?.barangay || '',
      city: user.address?.city || '',
      province: user.address?.province || ''
    }
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showPhone: user.publicProfile?.showPhone || false,
    showEmail: user.publicProfile?.showEmail || false,
    showAddress: user.publicProfile?.showAddress || false
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/profile/update', profileData);
      if (response.data.success) {
        updateUser(response.data.data);
        success('Profile updated successfully!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/profile/update', {
        publicProfile: privacySettings
      });
      if (response.data.success) {
        updateUser(response.data.data);
        success('Privacy settings updated!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData({ ...profileData, profileImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b">
            <div className="flex gap-4 px-6 overflow-x-auto">
              <TabButton
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                icon={User}
                label="Profile"
              />
              <TabButton
                active={activeTab === 'privacy'}
                onClick={() => setActiveTab('privacy')}
                icon={Shield}
                label="Privacy"
              />
              <TabButton
                active={activeTab === 'password'}
                onClick={() => setActiveTab('password')}
                icon={Lock}
                label="Password"
              />
            </div>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Profile Image</label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                        {profileData.profileImage ? (
                          <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow-lg">
                        <Camera className="w-5 h-5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Upload a new profile picture</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+639XXXXXXXXX"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: +639XXXXXXXXX</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell others about yourself..."
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Address</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={profileData.address.street}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, street: e.target.value }
                      })}
                      placeholder="Street Address"
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={profileData.address.barangay}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, barangay: e.target.value }
                      })}
                      placeholder="Barangay"
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={profileData.address.city}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, city: e.target.value }
                      })}
                      placeholder="City"
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={profileData.address.province}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, province: e.target.value }
                      })}
                      placeholder="Province"
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
              </form>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <form onSubmit={handlePrivacyUpdate} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Control what information is visible on your public profile
                  </p>
                </div>

                <PrivacyToggle
                  icon={Phone}
                  label="Show Phone Number"
                  description="Allow others to see your phone number on your profile"
                  checked={privacySettings.showPhone}
                  onChange={(checked) => setPrivacySettings({ ...privacySettings, showPhone: checked })}
                />

                <PrivacyToggle
                  icon={Mail}
                  label="Show Email Address"
                  description="Allow others to see your email address on your profile"
                  checked={privacySettings.showEmail}
                  onChange={(checked) => setPrivacySettings({ ...privacySettings, showEmail: checked })}
                />

                <PrivacyToggle
                  icon={MapPin}
                  label="Show Address"
                  description="Allow others to see your address on your profile"
                  checked={privacySettings.showAddress}
                  onChange={(checked) => setPrivacySettings({ ...privacySettings, showAddress: checked })}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Privacy Settings
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <PasswordInput
                  label="Current Password"
                  value={passwordData.currentPassword}
                  onChange={(value) => setPasswordData({ ...passwordData, currentPassword: value })}
                  show={showPasswords.current}
                  onToggle={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                />

                <PasswordInput
                  label="New Password"
                  value={passwordData.newPassword}
                  onChange={(value) => setPasswordData({ ...passwordData, newPassword: value })}
                  show={showPasswords.new}
                  onToggle={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                />

                <PasswordInput
                  label="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChange={(value) => setPasswordData({ ...passwordData, confirmPassword: value })}
                  show={showPasswords.confirm}
                  onToggle={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`py-4 px-4 font-medium transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

const PrivacyToggle = ({ icon: Icon, label, description, checked, onChange }) => (
  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

const PasswordInput = ({ label, value, onChange, show, onToggle }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

export default Settings;