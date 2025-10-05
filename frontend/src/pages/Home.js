import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  Plus,
  Filter,
  MapPin,
  Clock,
  AlertCircle,
  Package,
  Users,
  Heart,
  Navigation,
  X,
  ChevronRight,
  Search,
  Droplets,
  Home as HomeIcon,
  Shirt,
  Pill,
  DollarSign,
  Sparkles,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import requestService from "../services/requestService";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker colors based on urgency
const createCustomIcon = (urgency) => {
  const colors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444'
  };
  
  const color = colors[urgency] || '#3b82f6';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); color: white; font-size: 16px;">📍</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const Home = () => {
  const { user } = useAuth();
  const { success, error } = useNotification();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    urgency: "",
    type: ""
  });

  const [mapCenter] = useState([10.3157, 123.8854]);

  useEffect(() => {
    fetchRequests();
  }, [showCreateModal]);

  useEffect(() => {
    applyFilters();
  }, [requests, filters, searchQuery]);

  const fetchRequests = async () => {
    setLoading(true);
    const result = await requestService.getAllRequests({ status: "open" });

    if (result.success) {
      setRequests(Array.isArray(result.data) ? result.data : []);
    } else {
      setRequests([]);
      error(result.error || "Failed to fetch requests");
    }

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (filters.category) {
      filtered = filtered.filter((r) => r.category === filters.category);
    }
    if (filters.urgency) {
      filtered = filtered.filter((r) => r.urgency === filters.urgency);
    }
    if (filters.type) {
      filtered = filtered.filter((r) => r.type === filters.type);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleAcceptRequest = async (requestId) => {
    const result = await requestService.acceptRequest(requestId);
    if (result.success) {
      success("Request accepted! Check your dashboard.");
      setSelectedRequest(null);
      fetchRequests();
    } else {
      error(result.error);
    }
  };

  const openInMaps = (lat, lng, app) => {
    if (app === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (app === 'waze') {
      window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
    }
  };

  const urgencyColors = {
    low: "text-green-600 bg-green-50 border-green-200",
    medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
    high: "text-orange-600 bg-orange-50 border-orange-200",
    critical: "text-red-600 bg-red-50 border-red-200",
  };

  const typeIcons = {
    food: Package,
    water: Droplets,
    shelter: HomeIcon,
    clothing: Shirt,
    medical: Pill,
    money: DollarSign,
    other: AlertCircle,
  };

  const typeColors = {
    food: "text-orange-600 bg-orange-50",
    water: "text-blue-600 bg-blue-50",
    shelter: "text-purple-600 bg-purple-50",
    clothing: "text-pink-600 bg-pink-50",
    medical: "text-red-600 bg-red-50",
    money: "text-green-600 bg-green-50",
    other: "text-gray-600 bg-gray-50",
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Relief Hub
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  {filteredRequests.length} active requests
                </p>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Create</span>
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="food">Food</option>
                  <option value="water">Water</option>
                  <option value="shelter">Shelter</option>
                  <option value="clothing">Clothing</option>
                  <option value="medical">Medical</option>
                  <option value="money">Money</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Urgency</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>

                <button
                  onClick={() => setFilters({ category: "", urgency: "", type: "" })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-white transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Request Cards */}
        <div className="w-full md:w-96 lg:w-[28rem] bg-white border-r overflow-y-auto">
          {/* Stats Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold">{filteredRequests.length}</p>
                <p className="text-xs opacity-90">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredRequests.filter(r => r.urgency === 'critical').length}
                </p>
                <p className="text-xs opacity-90">Critical</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredRequests.filter(r => r.urgency === 'high').length}
                </p>
                <p className="text-xs opacity-90">High</p>
              </div>
            </div>
          </div>

          {/* Request Cards */}
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No requests found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filteredRequests.map((request) => {
                const Icon = typeIcons[request.type] || AlertCircle;
                return (
                  <div
                    key={request._id}
                    onClick={() => setSelectedRequest(request)}
                    className="group border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer bg-white"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${typeColors[request.type]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
                            {request.title}
                          </h3>
                          <p className="text-xs text-gray-500 capitalize">{request.type}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium border ${urgencyColors[request.urgency]}`}>
                        {request.urgency}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {request.description}
                    </p>

                    {/* Items */}
                    {request.items && request.items.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {request.items.map((item, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{request.location?.barangay || 'Location'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredRequests.map((request) => (
              <Marker
                key={request._id}
                position={[
                  request.location.coordinates[1],
                  request.location.coordinates[0],
                ]}
                icon={createCustomIcon(request.urgency)}
                eventHandlers={{
                  click: () => setSelectedRequest(request)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold mb-1 text-sm">{request.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{request.description}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${urgencyColors[request.urgency]}`}>
                      {request.urgency}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 z-10">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Urgency Level</h4>
            <div className="space-y-1">
              {['critical', 'high', 'medium', 'low'].map(level => (
                <div key={level} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    level === 'critical' ? 'bg-red-500' :
                    level === 'high' ? 'bg-orange-500' :
                    level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-xs capitalize text-gray-600">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
              <button
                onClick={() => setSelectedRequest(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  {React.createElement(typeIcons[selectedRequest.type] || AlertCircle, {
                    className: "w-8 h-8"
                  })}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedRequest.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full capitalize">
                      {selectedRequest.type}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                      selectedRequest.urgency === 'critical' ? 'bg-red-500' :
                      selectedRequest.urgency === 'high' ? 'bg-orange-500' :
                      selectedRequest.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}>
                      {selectedRequest.urgency} Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-gray-600">{selectedRequest.description}</p>
              </div>

              {/* Items Needed */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Items Needed
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedRequest.items.map((item, idx) => {
                      const ItemIcon = typeIcons[item] || AlertCircle;
                      return (
                        <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg ${typeColors[item]}`}>
                          <ItemIcon className="w-4 h-4" />
                          <span className="text-sm font-medium capitalize">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {selectedRequest.quantity && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Quantity/Details</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedRequest.quantity}</p>
                </div>
              )}

              {/* Location Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Details
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[80px]">Address:</span>
                    <span className="text-sm text-gray-900">
                      {selectedRequest.address || `${selectedRequest.location?.barangay}, ${selectedRequest.location?.city}`}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[80px]">Coordinates:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {selectedRequest.location.coordinates[1].toFixed(6)}, {selectedRequest.location.coordinates[0].toFixed(6)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[80px]">Barangay:</span>
                    <span className="text-sm text-gray-900">{selectedRequest.location?.barangay || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 min-w-[80px]">City:</span>
                    <span className="text-sm text-gray-900">{selectedRequest.location?.city || 'Cebu City'}</span>
                  </div>
                </div>
              </div>

              {/* Requester Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Requester Information
                </h3>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedRequest.requester?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedRequest.requester?.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{selectedRequest.requester?.userType}</p>
                    {selectedRequest.requester?.phone && (
                      <p className="text-xs text-gray-500">{selectedRequest.requester.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openInMaps(
                      selectedRequest.location.coordinates[1],
                      selectedRequest.location.coordinates[0],
                      'google'
                    )}
                    className="flex items-center justify-center gap-2 p-4 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition font-medium"
                  >
                    <img src="https://www.google.com/images/branding/product/1x/maps_48dp.png" alt="Google Maps" className="w-6 h-6" />
                    Google Maps
                  </button>
                  <button
                    onClick={() => openInMaps(
                      selectedRequest.location.coordinates[1],
                      selectedRequest.location.coordinates[0],
                      'waze'
                    )}
                    className="flex items-center justify-center gap-2 p-4 border-2 border-cyan-500 text-cyan-600 rounded-xl hover:bg-cyan-50 transition font-medium"
                  >
                    <div className="w-6 h-6 bg-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">W</div>
                    Waze
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.requester?._id !== user._id && (
                <div className="pt-2">
                  <button
                    onClick={() => handleAcceptRequest(selectedRequest._id)}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Heart className="w-5 h-5" />
                    Accept & Help This Request
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    By accepting, you commit to helping fulfill this request
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <CreateRequestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
};

// Create Request Modal Component
const CreateRequestModal = ({ onClose, onSuccess }) => {
  const { success, error } = useNotification();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "food",
    category: "food",
    urgency: "medium",
    quantity: "",
    items: ["food"],
    barangay: "",
    city: "Cebu City",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        (err) => console.warn("Location access denied:", err)
      );
    }
  }, []);

  const handleItemToggle = (item) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.includes(item)
        ? prev.items.filter(i => i !== item)
        : [...prev.items, item]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.latitude || !formData.longitude) {
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setFormData((prev) => ({
                ...prev,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }));
              resolve();
            },
            () => resolve()
          );
        });
      }
    }

    const requestData = {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      lat: parseFloat(formData.latitude),
      lng: parseFloat(formData.longitude),
      address: `${formData.barangay}, ${formData.city}`,
      category: formData.category,
      urgency: formData.urgency,
      quantity: formData.quantity,
      barangay: formData.barangay,
      city: formData.city,
      items: formData.items
    };

    const result = await requestService.createRequest(requestData);
    setLoading(false);

    if (result.success) {
      success("Request created successfully!");
      onSuccess();
    } else {
      error(result.error || "Something went wrong.");
    }
  };

  const typeIcons = {
    food: Package,
    water: Droplets,
    shelter: HomeIcon,
    clothing: Shirt,
    medical: Pill,
    money: DollarSign,
    other: AlertCircle,
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-3xl md:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold mb-2">Create Relief Request</h2>
          <p className="text-sm opacity-90">Step {step} of 3</p>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-white' : 'bg-white/30'}`}></div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Request Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Need food supplies for family"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide details about your request..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Primary Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setFormData({ 
                      ...formData, 
                      type,
                      category: type === 'food' || type === 'water' ? 'food' :
                               type === 'medical' ? 'medical' :
                               type === 'shelter' ? 'shelter' : 'other',
                      items: [type]
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="food">Food</option>
                  <option value="water">Water</option>
                  <option value="shelter">Shelter</option>
                  <option value="clothing">Clothing</option>
                  <option value="medical">Medical</option>
                  <option value="money">Money</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Urgency</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Quantity</label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10 food packs"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Items Needed */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select All Items Needed</label>
                <p className="text-sm text-gray-500 mb-4">Choose all that apply</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(typeIcons).map(([key, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleItemToggle(key)}
                      className={`p-4 rounded-xl border-2 transition ${
                        formData.items.includes(key)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium capitalize">{key}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Barangay</label>
                <input
                  type="text"
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter barangay name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Cebu City"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setFormData((prev) => ({
                          ...prev,
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        }));
                        success("Location detected!");
                      },
                      (err) => error("Unable to get location: " + err.message)
                    );
                  }
                }}
                className="w-full p-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Use My Current Location
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Previous
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow-lg"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create Request
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;