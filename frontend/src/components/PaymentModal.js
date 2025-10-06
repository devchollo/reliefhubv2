// ============================================
// frontend/src/components/PaymentModal.js - NEW
// ============================================
import React, { useState } from 'react';
import { X, DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../config/api';

const PaymentModal = ({ request, onClose, onSuccess }) => {
  const { success, error } = useNotification();
  const [amount, setAmount] = useState(request.amountNeeded || '');
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [gcashReference, setGcashReference] = useState('');
  const [loading, setLoading] = useState(false);

  const platformFee = 0.10; // 10%
  const finalAmount = parseFloat(useCustom ? customAmount : amount) || 0;
  const fee = finalAmount * platformFee;
  const recipientGets = finalAmount - fee;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (finalAmount < 10) {
      error('Minimum donation is ₱10');
      return;
    }

    if (!gcashReference.trim()) {
      error('Please enter GCash reference number');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/transactions', {
        requestId: request._id,
        amount: finalAmount,
        gcashReference: gcashReference.trim(),
        notes: `Donation for: ${request.title}`
      });

      if (response.data.success) {
        success(`₱${recipientGets.toFixed(2)} sent successfully!`);
        onSuccess();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Send Money</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Request Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-1">{request.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{request.description}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Requested by:</span>
            <span className="text-gray-900">{request.requester?.name}</span>
          </div>
          {request.amountNeeded && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">Amount needed:</span>
              <span className="text-lg font-bold text-blue-600">
                ₱{request.amountNeeded.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Amount</label>
            
            {/* Exact Amount Button */}
            {request.amountNeeded && (
              <button
                type="button"
                onClick={() => {
                  setUseCustom(false);
                  setAmount(request.amountNeeded);
                }}
                className={`w-full p-4 border-2 rounded-xl mb-3 transition ${
                  !useCustom
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Send Exact Amount</span>
                  <span className="text-xl font-bold">₱{request.amountNeeded.toLocaleString()}</span>
                </div>
              </button>
            )}

            {/* Custom Amount */}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`w-full p-4 border-2 rounded-xl mb-2 transition ${
                useCustom
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">Custom Amount</span>
            </button>

            {useCustom && (
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="10"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    required={useCustom}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum: ₱10</p>
              </div>
            )}
          </div>

          {/* Payment Breakdown */}
          {finalAmount >= 10 && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Your donation</span>
                <span className="font-semibold">₱{finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform fee (10%)</span>
                <span className="font-semibold text-orange-600">-₱{fee.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between">
                <span className="font-semibold text-gray-900">Recipient receives</span>
                <span className="font-bold text-green-600 text-lg">₱{recipientGets.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* GCash Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-2">GCash Payment Instructions:</p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Send ₱{finalAmount.toFixed(2)} to GCash number: <strong>{request.gcashNumber || request.requester?.phone}</strong></li>
                  <li>Save your GCash reference number</li>
                  <li>Enter the reference number below</li>
                </ol>
              </div>
            </div>
          </div>

          {/* GCash Reference Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              GCash Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={gcashReference}
              onChange={(e) => setGcashReference(e.target.value)}
              placeholder="Enter GCash reference #"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This verifies your payment. Example: 1234567890
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              Please ensure you've completed the GCash payment before submitting. 
              Platform fee helps us maintain and improve Relief Hub services.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || finalAmount < 10}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Confirm Payment of ₱{finalAmount.toFixed(2)}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;