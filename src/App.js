// employer-notification-frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, Trash2, Search, Filter, Loader2, AlertCircle, TrendingUp, TrendingDown, MinusCircle, Info, LogOut, ShieldAlert, User } from 'lucide-react';
import { io } from 'socket.io-client';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './Auth/Login';
import Register from './Auth/Register';
import NotificationDetailModal from './Components/NotificationDetailModal';
import UserProfile from './Components/UserProfile';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api';
// Base URL for your Socket.io server
const SOCKET_SERVER_URL = 'http://localhost:5000';

// Main App component
const App = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');

  const [selectedNotification, setSelectedNotification] = useState(null);

  const currentUserId = currentUser ? currentUser.uid : null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const latestNotifications = notifications
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/notification/${currentUserId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        console.log("Firebase: User is logged in:", user.uid);
        fetchNotifications();
      } else {
        console.log("Firebase: User is logged out.");
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const socket = io(SOCKET_SERVER_URL);

    socket.on('connect', () => {
      console.log('Socket.io: Connected');
      socket.emit('registerUser', currentUserId);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io: Disconnected');
    });

    socket.on('newNotification', (newNotification) => {
      console.log('Socket.io: Received new notification:', newNotification);
      if (newNotification.userId === currentUserId) {
        setNotifications(prev => [newNotification, ...prev]);
      }
    });

    socket.on('notificationsUpdated', ({ type, notificationIds, isRead, userId: eventUserId }) => {
      console.log('Socket.io: Received notificationsUpdated event.');
      console.log('  Event data:', { type, notificationIds, isRead, eventUserId });
      console.log('  Current Frontend userId:', currentUserId);

      if (eventUserId !== currentUserId) {
        console.log('  Skipping update: Event userId does not match current user.');
        return;
      }

      setNotifications(prevNotifications => {
        let updatedNotifications = prevNotifications;
        if (type === 'markAll') {
          updatedNotifications = prevNotifications.map(n => ({ ...n, isRead: isRead }));
        } else if (type === 'markSpecific' && notificationIds && notificationIds.length > 0) {
          updatedNotifications = prevNotifications.map(n => {
            if (notificationIds.includes(n._id)) {
              return { ...n, isRead: isRead };
            }
            return n;
          });
        }
        return updatedNotifications;
      });
    });

    socket.on('notificationDeleted', ({ id: deletedNotificationId, userId: eventUserId }) => {
      console.log('Socket.io: Received notification deletion event.');
      console.log('  Event data:', { deletedNotificationId, eventUserId });
      console.log('  Current Frontend userId:', currentUserId);

      if (eventUserId !== currentUserId) {
        console.log('  Skipping deletion: Event userId does not match current user.');
        return;
      }
      setNotifications(prev => prev.filter(n => n._id !== deletedNotificationId));
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId]);

  const markNotificationAsRead = async (id, status) => {
    try {
      if (!currentUser) throw new Error("User not authenticated.");
      const idToken = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/notification/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ notificationIds: [id], isRead: status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(`Failed to update notification status: ${err.message}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!currentUser) throw new Error("User not authenticated.");
      const idToken = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/notification/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ markAll: true, isRead: true }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(`Failed to mark all notifications as read: ${err.message}`);
    }
  };

  const deleteNotification = async (id) => {
    try {
      if (!currentUser) throw new Error("User not authenticated.");
      const idToken = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/notification/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(`Failed to delete notification: ${err.message}`);
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err.message);
      setError('Failed to log out.');
    }
  };

  const openNotificationDetails = (notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markNotificationAsRead(notification._id, true);
    }
  };

  const closeNotificationDetails = () => {
    setSelectedNotification(null);
  };

  const handlePasswordChangeSuccess = () => {
    console.log("Password changed successfully!");
    setCurrentView('dashboard');
  };


  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortByPriority, setSortByPriority] = useState(false);

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high':
        return { icon: <AlertCircle className="w-5 h-5 text-red-500" />, color: 'bg-red-50 border-red-300' };
      case 'medium':
        return { icon: <MinusCircle className="w-5 h-5 text-yellow-500" />, color: 'bg-yellow-50 border-yellow-300' };
      case 'low':
        return { icon: <TrendingDown className="w-5 h-5 text-gray-500" />, color: 'bg-gray-50 border-gray-300' };
      default:
        return { icon: null, color: 'bg-white border-gray-200' };
    }
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'application': return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-blue-500"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
      case 'interview': return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>;
      case 'feedback': return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
      case 'job_post_status': return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-check"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>;
      case 'suspicious_activity': return <ShieldAlert className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };


  const filteredNotifications = notifications
    .filter(notification => {
      const matchesType = filterType === 'all' || notification.type === filterType;
      const matchesSearch = searchTerm.toLowerCase() === '' || notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      if (sortByPriority) {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const priorityA = priorityOrder[a.priority] || 0;
        const priorityB = priorityOrder[b.priority] || 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin w-12 h-12 text-indigo-500" />
        <p className="ml-4 text-lg text-gray-700">Checking authentication...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      authMode === 'login' ?
        <Login onAuthSuccess={handleAuthSuccess} switchToRegister={() => setAuthMode('register')} /> :
        <Register onAuthSuccess={handleAuthSuccess} switchToLogin={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <nav className="bg-gradient-to-r from-indigo-700 to-indigo-900 shadow-lg p-4 flex justify-between items-center rounded-b-xl">
        <div className="text-3xl font-extrabold text-white cursor-pointer tracking-wide" onClick={() => setCurrentView('dashboard')}>
          EmployerLink
        </div>
        <div className="flex items-center space-x-4">
          {currentUser && (
            <div className="text-sm text-indigo-100 hidden sm:block">
              Welcome, <span className="font-semibold">{currentUser.email}</span>
            </div>
          )}

          <button
            onClick={() => setCurrentView('userProfile')}
            className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-200 shadow-md"
            title="User Profile"
          >
            <User className="h-6 w-6" />
          </button>

          <div className="relative">
            <button
              className="relative p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-200 shadow-md"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2 shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl z-10 border border-gray-200 transform origin-top-right scale-100 transition-all duration-200 ease-out">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-gray-800">Notifications</h3>
                  <button
                    onClick={markAllAsRead}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
                {loading ? (
                  <div className="p-4 text-center text-gray-500 flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" /> Loading...
                  </div>
                ) : error ? (
                  <p className="p-4 text-center text-red-500">{error}</p>
                ) : latestNotifications.length === 0 ? (
                  <p className="p-4 text-center text-gray-500 text-center">No notifications yet.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {latestNotifications.map(notification => {
                      const { icon, color } = getPriorityInfo(notification.priority);
                      return (
                        <div
                          key={notification._id}
                          className={`p-4 border-b border-gray-100 ${notification.isRead ? 'bg-gray-50' : `bg-white font-medium`} hover:bg-gray-100 cursor-pointer flex items-start`}
                          onClick={() => {
                            openNotificationDetails(notification);
                          }}
                        >
                          <div className="mr-2 mt-1 flex-shrink-0">
                            {getNotificationTypeIcon(notification.type)}
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-semibold text-gray-800">{notification.title}</h4>
                              <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            {notification.priorityReason && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Info className="w-3 h-3 mr-1" />
                                <span>AI Reason: {notification.priorityReason}</span>
                              </div>
                            )}
                            <div className="flex justify-end gap-2 mt-2">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markNotificationAsRead(notification._id, true); }}
                                  className="p-1 rounded-full bg-indigo-100 text-indigo-600 hover:text-indigo-700"
                                  title="Mark as Read"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {notification.isRead && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markNotificationAsRead(notification._id, false); }}
                                  className="p-1 rounded-full text-gray-500 hover:text-gray-700"
                                  title="Mark as Unread"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                                className="p-1 rounded-full text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="p-3 text-center border-t border-gray-200">
                  <button
                    onClick={() => {
                      setCurrentView('notificationCenter');
                      setShowDropdown(false);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium w-full py-2 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200 shadow-md"
            title="Logout"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-6">
        {currentView === 'dashboard' && (
          <div className="bg-white p-8 rounded-lg shadow-xl text-center border border-gray-200 transform transition-transform duration-300 hover:scale-[1.01]">
            <h2 className="text-4xl font-extrabold text-indigo-800 mb-4 animate-fade-in-down">Welcome to Your Employer Dashboard!</h2>
            <p className="text-lg text-gray-700 mb-6 animate-fade-in">
              You are logged in as: <span className="font-mono bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-base shadow-sm">{currentUser.email}</span>
            </p>
            <p className="text-md text-gray-600 leading-relaxed max-w-2xl mx-auto animate-fade-in delay-200">
              Stay informed with real-time updates on applicants, interviews, and important hiring events. Our intelligent system prioritizes what matters most, and suggests next steps so you never miss a beat.
            </p>
            <div className="mt-8 flex justify-center space-x-4 animate-fade-in delay-300">
                <button
                    onClick={() => setCurrentView('notificationCenter')}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <Bell className="w-5 h-5 mr-2" /> View Notifications
                </button>
                <button
                    onClick={() => setCurrentView('userProfile')}
                    className="flex items-center px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-full shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                    <User className="w-5 h-5 mr-2" /> Manage Profile
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-8">
              Your User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{currentUserId}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              For backend testing with Postman, use your Firebase UID as `userId` in the request body and include the `Authorization: Bearer` header.
            </p>
          </div>
        )}

        {currentView === 'notificationCenter' && (
          <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-700 mb-6">Notification Center</h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <div className="relative">
                <select
                  className="appearance-none w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="application">Applicants</option>
                  <option value="interview">Interviews</option>
                  <option value="feedback">Feedback</option>
                  <option value="job_post_status">Job Post Status</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                </select>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <div className="flex items-center bg-gray-50 p-2 rounded-md border border-gray-200 shadow-sm">
                <input
                  type="checkbox"
                  id="sortByPriority"
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={sortByPriority}
                  onChange={(e) => setSortByPriority(e.target.checked)}
                />
                <label htmlFor="sortByPriority" className="text-gray-700 text-sm font-medium cursor-pointer">Sort by Priority</label>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-500 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 mb-3" />
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <p className="text-center py-10 text-red-500 text-lg">{error}</p>
            ) : filteredNotifications.length === 0 ? (
              <p className="text-center text-gray-500 text-lg py-10">No notifications found matching your criteria.</p>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(notification => {
                  const { icon, color } = getPriorityInfo(notification.priority);
                  return (
                    <div
                      key={notification._id}
                      className={`flex items-center p-4 rounded-lg shadow-sm transition-all duration-200 ease-in-out border ${notification.isRead ? 'bg-gray-50 border-gray-200' : `${color} border-current`} hover:shadow-md cursor-pointer`}
                      onClick={() => openNotificationDetails(notification)}
                    >
                      <div className="mr-3 flex-shrink-0">
                        {getNotificationTypeIcon(notification.type)}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-lg font-semibold ${notification.isRead ? 'text-gray-700' : 'text-indigo-700'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-sm text-gray-500">{formatDate(notification.createdAt)}</span>
                        </div>
                        <p className={`text-gray-600 ${notification.isRead ? 'text-gray-600' : 'text-gray-800'} text-sm mt-1 line-clamp-2`}>
                          {notification.message}
                        </p>
                        {notification.priorityReason && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Info className="w-3 h-3 mr-1" />
                            <span>AI Reason: {notification.priorityReason}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center ml-4 space-y-2">
                        {!notification.isRead ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); markNotificationAsRead(notification._id, true); }}
                            className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:text-indigo-700"
                            title="Mark as Read"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); markNotificationAsRead(notification._id, false); }}
                            className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                            title="Mark as Unread"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {currentView === 'userProfile' && (
          <UserProfile currentUser={currentUser} onPasswordChangeSuccess={handlePasswordChangeSuccess} />
        )}
      </main>

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={closeNotificationDetails}
        />
      )}
    </div>
  );
};

export default App;
