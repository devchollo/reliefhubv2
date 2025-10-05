import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  Plus,
  Filter,
  MapPin,
  Clock,
  AlertCircle,
  Package,
  Users,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import requestService from "../services/requestService";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const Home = () => {
  const { user } = useAuth();
  const { success, error } = useNotification();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    urgency: "",
    status: "open",
  });

  // Cebu City center
  const [mapCenter] = useState([10.3157, 123.8854]);

  useEffect(() => {
    fetchRequests();
  }, [showCreateModal]);

  useEffect(() => {
    applyFilters();
  }, [requests, filters]);

  const fetchRequests = async () => {
    setLoading(true);
    const result = await requestService.getAllRequests({ status: "open" });

    if (result.success && Array.isArray(result.data)) {
      setRequests(result.data);
    } else {
      setRequests([]); // 👈 prevent undefined
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

    setFilteredRequests(filtered);
  };

  const handleAcceptRequest = async (requestId) => {
    const result = await requestService.acceptRequest(requestId);
    if (result.success) {
      success("Request accepted! Check your dashboard.");
      fetchRequests();
    } else {
      error(result.error);
    }
  };

  const urgencyColors = {
    low: "text-green-600 bg-green-50",
    medium: "text-yellow-600 bg-yellow-50",
    high: "text-orange-600 bg-orange-50",
    critical: "text-red-600 bg-red-50",
  };

  const categoryIcons = {
    food: Package,
    medical: Heart,
    shelter: Users,
    other: AlertCircle,
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Relief Requests
            </h1>
            <p className="text-sm text-gray-600">
              Help those in need around Cebu
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Request
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Request List */}
        <div className="w-96 bg-white border-r overflow-y-auto">
          {/* Filters */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Filter className="w-4 h-4" />
              Filters
            </div>

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              <option value="food">Food</option>
              <option value="medical">Medical</option>
              <option value="shelter">Shelter</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filters.urgency}
              onChange={(e) =>
                setFilters({ ...filters, urgency: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Urgency Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Request Cards */}
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No requests found
              </div>
            ) : (
              filteredRequests.map((request) => {
                const Icon = categoryIcons[request.category] || AlertCircle;
                return (
                  <div
                    key={request._id}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">
                          {request.title}
                        </h3>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          urgencyColors[request.urgency]
                        }`}
                      >
                        {request.urgency}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {request.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {request.location.barangay}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {request.requester._id !== user._id && (
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        Accept Request
                      </button>
                    )}
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
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold mb-1">{request.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {request.description}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        urgencyColors[request.urgency]
                      }`}
                    >
                      {request.urgency}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

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
    category: "food",
    urgency: "medium",
    quantity: "",
    barangay: "",
    city: "Cebu City",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Try to auto-detect location if blank
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
            () => resolve() // just continue if user blocks
          );
        });
      }
    }

    const requestData = {
      type: formData.category,
      title: formData.title,
      description: formData.description,
      lat: parseFloat(formData.latitude),
      lng: parseFloat(formData.longitude),
      address: `${formData.barangay}, ${formData.city}`,
      // optional extra fields if backend later supports them
      gcashNumber: null,
      amountNeeded: null,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Create Relief Request</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg h-24"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="food">Food</option>
                <option value="medical">Medical</option>
                <option value="shelter">Shelter</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) =>
                  setFormData({ ...formData, urgency: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Quantity/Details
            </label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="e.g., 10 food packs, 5 medicine boxes"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Barangay</label>
            <input
              type="text"
              value={formData.barangay}
              onChange={(e) =>
                setFormData({ ...formData, barangay: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
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
                    const { latitude, longitude } = pos.coords;
                    setFormData((prev) => ({ ...prev, latitude, longitude }));
                  },
                  (err) => {
                    error("Unable to fetch location: " + err.message);
                  }
                );
              } else {
                error("Geolocation is not supported by your browser.");
              }
            }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Use my current location
          </button>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;
