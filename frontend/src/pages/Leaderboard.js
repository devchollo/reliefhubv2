import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import api from "../config/api";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Heart,
  Package,
  Star,
  Users,
  Crown,
  Zap,
} from "lucide-react";

const Leaderboard = () => {
  const { user } = useAuth();
  const { error } = useNotification();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [timeframe, setTimeframe] = useState("all-time");

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/users/leaderboard?filter=${filter}&timeframe=${timeframe}`
      );

      console.log("📊 Leaderboard data:", response.data);

      // Backend now returns properly formatted data
      setLeaderboard(response.data.data || []);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      error("Failed to fetch leaderboard");
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">
            {rank}
          </div>
        );
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const StatBadge = ({ icon: Icon, value, label }) => (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
      <Icon className="w-4 h-4 text-blue-600" />
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-lg text-gray-600">
            Celebrating our top contributors
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Contributors</option>
                <option value="donors">Top Donors</option>
                <option value="volunteers">Top Volunteers</option>
                <option value="organizations">Organizations</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all-time">All Time</option>
                <option value="this-year">This Year</option>
                <option value="this-month">This Month</option>
                <option value="this-week">This Week</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-6 w-full text-center transform translate-y-8">
                <Medal className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-2xl">
                  {leaderboard[1].name.charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {leaderboard[1].name}
                </h3>
                <p className="text-sm text-gray-600 capitalize mb-3">
                  {leaderboard[1].userType}
                </p>
                <div className="flex justify-center gap-3">
                  <StatBadge
                    icon={Heart}
                    value={leaderboard[1].totalHelped}
                    label="Helped"
                  />
                  <StatBadge
                    icon={Star}
                    value={leaderboard[1].averageRating?.toFixed(1) || "N/A"}
                    label="Rating"
                  />
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-xl shadow-2xl border-2 border-yellow-400 p-6 w-full text-center relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-3 shadow-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="mt-4 mb-3">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-3xl">
                    {leaderboard[0].name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-1">
                    {leaderboard[0].name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize mb-3">
                    {leaderboard[0].userType}
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <StatBadge
                    icon={Heart}
                    value={leaderboard[0].totalHelped}
                    label="Helped"
                  />
                  <StatBadge
                    icon={Star}
                    value={leaderboard[0].averageRating?.toFixed(1) || "N/A"}
                    label="Rating"
                  />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-yellow-600">
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="font-bold">Champion</span>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-xl shadow-lg border-2 border-orange-300 p-6 w-full text-center transform translate-y-8">
                <Award className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                  {leaderboard[2].name.charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {leaderboard[2].name}
                </h3>
                <p className="text-sm text-gray-600 capitalize mb-3">
                  {leaderboard[2].userType}
                </p>
                <div className="flex justify-center gap-3">
                  <StatBadge
                    icon={Heart}
                    value={leaderboard[2].totalHelped}
                    label="Helped"
                  />
                  <StatBadge
                    icon={Star}
                    value={leaderboard[2].averageRating?.toFixed(1) || "N/A"}
                    label="Rating"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    User
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Helped
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Completed
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaderboard.slice(3).map((person, index) => {
                  const rank = index + 4;
                  const isCurrentUser = person._id === user._id;

                  return (
                    <tr
                      key={person._id}
                      className={`hover:bg-gray-50 transition ${
                        isCurrentUser ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getRankIcon(rank)}
                          {isCurrentUser && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {person.profileImage ? (
                              <img
                                src={person.profileImage}
                                alt={person.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              person.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {person.name}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {person.userType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="font-semibold">
                            {person.totalHelped || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="w-4 h-4 text-green-500" />
                          <span className="font-semibold">
                            {person.completedRequests || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">
                            {person.averageRating
                              ? person.averageRating.toFixed(1)
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-blue-600">
                          {person.points || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No data available for the selected filters</p>
            </div>
          )}
        </div>

        {/* Current User Highlight */}
        {user && leaderboard.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-sm opacity-90">Your Position</p>
                  <h3 className="text-2xl font-bold">{user.name}</h3>
                  <p className="text-sm opacity-75">
                    Rank: #
                    {leaderboard.findIndex((p) => p._id === user._id) + 1 ||
                      "Unranked"}
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {leaderboard.find((p) => p._id === user._id)?.totalHelped ||
                      user.stats?.totalHelped ||
                      0}
                  </p>
                  <p className="text-sm opacity-75">People Helped</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {leaderboard.find((p) => p._id === user._id)?.points ||
                      user.stats?.points ||
                      0}
                  </p>
                  <p className="text-sm opacity-75">Total Points</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {leaderboard
                      .find((p) => p._id === user._id)
                      ?.averageRating?.toFixed(1) ||
                      user.stats?.averageRating?.toFixed(1) ||
                      "N/A"}
                  </p>
                  <p className="text-sm opacity-75">Rating</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                How Points are Calculated
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Completing a request: 10 points</li>
                <li>• Receiving a 5-star rating: 5 bonus points</li>
                <li>• Helping critical urgency requests: 15 points</li>
                <li>• Monthly consistency bonus: Up to 20 points</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
