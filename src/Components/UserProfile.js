// employer-notification-frontend/src/Components/UserProfile.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const UserProfile = ({ currentUser, onPasswordChangeSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setMessage('New password and confirmation do not match.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      // Re-authenticate user before changing password for security
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update the password
      await updatePassword(currentUser, newPassword);

      setMessage('Password updated successfully!');
      setMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      onPasswordChangeSuccess(); // Callback to parent if needed
    } catch (error) {
      console.error('Error changing password:', error);
      let errorMessage = 'Failed to update password. Please try again.';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log in again to update your password.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="bg-white p-4 md:p-8 rounded-lg shadow-xl w-full max-w-4xl mx-auto border border-gray-200 mt-6 mb-10 overflow-auto">
  <h2 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-6 text-center border-b pb-4 border-indigo-100">
    Your Profile
  </h2>

  <div className="mb-8 p-4 md:p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
    <p className="text-lg font-semibold text-indigo-800 mb-3">Account Information</p>
    <p className="text-gray-700 mb-2">
      <span className="font-medium text-gray-800">Email:</span>{" "}
      <span className="font-mono bg-indigo-100 px-2 py-1 rounded-md text-sm">{currentUser.email}</span>
    </p>
    <p className="text-gray-700">
      <span className="font-medium text-gray-800">User ID:</span>{" "}
      <span className="font-mono bg-indigo-100 px-2 py-1 rounded-md text-sm">{currentUser.uid}</span>
    </p>
  </div>

  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center border-b pb-3 border-gray-200">
    Change Password
  </h3>

  {message && (
    <div
      className={`flex items-center p-3 rounded-md mb-4 shadow-sm ${
        messageType === "success"
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      }`}
    >
      {messageType === "success" ? (
        <CheckCircle className="w-5 h-5 mr-2" />
      ) : (
        <XCircle className="w-5 h-5 mr-2" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )}

  <form onSubmit={handlePasswordChange} className="space-y-5">
    <div>
      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
        Current Password
      </label>
      <input
        type="password"
        id="currentPassword"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Enter current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
    </div>
    <div>
      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
        New Password
      </label>
      <input
        type="password"
        id="newPassword"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Enter new password (min 6 characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
    </div>
    <div>
      <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
        Confirm New Password
      </label>
      <input
        type="password"
        id="confirmNewPassword"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Confirm new password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        required
      />
    </div>
    <button
      type="submit"
      className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center font-semibold text-lg shadow-md"
      disabled={loading}
    >
      {loading && <Loader2 className="animate-spin h-5 w-5 mr-3 text-white" />}
      Change Password
    </button>
  </form>
</div>

  );
};

export default UserProfile;
