// employer-notification-frontend/src/Components/NotificationDetailModal.js
import React from 'react';
import { X, Info, ExternalLink, Lightbulb } from 'lucide-react'; // Removed sentiment and list icons

const NotificationDetailModal = ({ notification, onClose }) => {
  if (!notification) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="
        bg-white rounded-xl shadow-2xl
        max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl
        w-full mx-auto p-6 sm:p-8 relative
        transform transition-transform duration-300 scale-95 animate-scale-in
        max-h-[90vh] overflow-y-auto
      ">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          aria-label="Close notification details"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Header */}
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-800 mb-4 pr-10 border-b pb-3 border-indigo-100">
          {notification.title}
        </h2>

        {/* Details Content */}
        <div className="space-y-4 text-gray-700 text-base mt-4 pb-4">
          <p>
            <span className="font-semibold text-gray-800">Type:</span> <span className="capitalize">{notification.type.replace('_', ' ')}</span>
          </p>
          <p>
            <span className="font-semibold text-gray-800">Received:</span> {formatDate(notification.createdAt)}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Status:</span> {notification.isRead ? 'Read' : 'Unread'}
          </p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-inner">
            <p className="font-semibold mb-2 text-gray-800">Full Message:</p>
            <p className="text-sm leading-relaxed">{notification.message}</p>
          </div>

          {/* AI Priority and Reason */}
          {notification.priority && (
            <div className="flex items-center text-base font-semibold pt-2">
              <span className="mr-2 text-gray-800">Priority:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
                notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {capitalize(notification.priority)}
              </span>
            </div>
          )}
          {notification.priorityReason && (
            <div className="flex items-start text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-inner">
              <Info className="w-4 h-4 mr-2 mt-1 text-blue-600 flex-shrink-0" />
              <span><span className="font-semibold text-blue-800">AI Reason:</span> {notification.priorityReason}</span>
            </div>
          )}

          {/* AI Suggested Actions */}
          {notification.suggestedActions && notification.suggestedActions.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 shadow-inner">
              <p className="font-semibold mb-2 text-purple-800 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-purple-600" /> Suggested Actions:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {notification.suggestedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Link */}
          {notification.link && (
            <div className="pt-4 border-t border-gray-200 mt-4 flex justify-center">
              <a
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Go to Details <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;
