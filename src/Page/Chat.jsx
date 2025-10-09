import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Search, X, Plus, UserPlus, Clock, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Chat({ user }) {
  const { apiRequest } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailSearchResults, setEmailSearchResults] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [messageRequests, setMessageRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('contacts');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchAllUsers();
    loadContactsFromStorage();
  }, []);

  useEffect(() => {
    fetchLastMessagesForContacts();
    fetchMessageRequests();
  }, [contacts]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContactsFromStorage = () => {
    const savedContacts = localStorage.getItem(`contacts_${user.id}`);
    if (savedContacts) {
      const contactIds = JSON.parse(savedContacts);
      setContacts(contactIds);
    }
  };

  const saveContactsToStorage = (contactIds) => {
    localStorage.setItem(`contacts_${user.id}`, JSON.stringify(contactIds));
  };

  const fetchAllUsers = async () => {
    try {
      const response = await apiRequest('http://localhost:3001/users/search');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessageRequests = async () => {
    try {
      const response = await apiRequest('http://localhost:3001/messages');
      if (response.ok) {
        const allMessages = await response.json();
        
        const requestsMap = new Map();
        
        allMessages.forEach(msg => {
          if (msg.receiver_id === user.id && !contacts.includes(msg.sender_id)) {
            if (!requestsMap.has(msg.sender_id)) {
              requestsMap.set(msg.sender_id, {
                userId: msg.sender_id,
                userName: msg.sender_name,
                userImage: msg.sender_image,
                lastMessage: msg.message,
                timestamp: msg.timestamp,
                unreadCount: msg.read === 0 ? 1 : 0
              });
            } else {
              const existing = requestsMap.get(msg.sender_id);
              if (new Date(msg.timestamp) > new Date(existing.timestamp)) {
                existing.lastMessage = msg.message;
                existing.timestamp = msg.timestamp;
              }
              if (msg.read === 0) {
                existing.unreadCount++;
              }
            }
          }
        });
        
        setMessageRequests(Array.from(requestsMap.values()));
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
    }
  };

  const fetchLastMessagesForContacts = async () => {
    try {
      const response = await apiRequest('http://localhost:3001/messages');
      if (response.ok) {
        const allMessages = await response.json();
        
        const lastMsgMap = {};
        const unreadMap = {};
        
        contacts.forEach(contactId => {
          const conversationMsgs = allMessages.filter(
            msg => 
              (msg.sender_id === contactId && msg.receiver_id === user.id) ||
              (msg.sender_id === user.id && msg.receiver_id === contactId)
          );
          
          if (conversationMsgs.length > 0) {
            const sorted = conversationMsgs.sort((a, b) => 
              new Date(b.timestamp) - new Date(a.timestamp)
            );
            lastMsgMap[contactId] = sorted[0];
            
            const unread = conversationMsgs.filter(
              msg => msg.receiver_id === user.id && msg.read === 0
            ).length;
            unreadMap[contactId] = unread;
          }
        });
        
        setLastMessages(lastMsgMap);
        setUnreadCounts(unreadMap);
      }
    } catch (error) {
      console.error('Error fetching last messages:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await apiRequest(
        `http://localhost:3001/messages/conversation/${selectedUser.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        data.forEach(msg => {
          if (msg.receiver_id === user.id && msg.read === 0) {
            apiRequest(`http://localhost:3001/messages/${msg.id}/read`, {
              method: 'PUT'
            });
          }
        });
        
        fetchLastMessagesForContacts();
        fetchMessageRequests();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!newMessage.trim() || !selectedUser || selectedUser.isRequest) return;

    apiRequest('http://localhost:3001/messages', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: selectedUser.id,
        message: newMessage
      })
    }).then(response => {
      if (response && response.ok) {
        return response.json();
      }
    }).then(sentMessage => {
      if (sentMessage) {
        setMessages(prev => ([...prev, {
          ...sentMessage,
          sender_name: user.name,
          receiver_name: selectedUser.name
        }]));
        setNewMessage('');
        fetchLastMessagesForContacts();
      }
    }).catch(error => {
      console.error('Error sending message:', error);
    });
  };

  const viewMessageRequest = (userId) => {
    const requestedUser = allUsers.find(u => u.id === userId);
    if (requestedUser) {
      setSelectedUser({ ...requestedUser, isRequest: true });
    }
  };

  const acceptMessageRequest = (userId) => {
    if (!contacts.includes(userId)) {
      const newContacts = [...contacts, userId];
      setContacts(newContacts);
      saveContactsToStorage(newContacts);
      
      setMessageRequests(messageRequests.filter(req => req.userId !== userId));
      setActiveTab('contacts');
      
      const requestedUser = allUsers.find(u => u.id === userId);
      if (requestedUser) {
        setSelectedUser(requestedUser);
      }
    }
  };

  const deleteMessageRequest = async (userId) => {
    if (window.confirm('Delete all messages from this user?')) {
      try {
        const response = await apiRequest('http://localhost:3001/messages');
        if (response.ok) {
          const allMessages = await response.json();
          const messagesToDelete = allMessages.filter(
            msg => msg.sender_id === userId && msg.receiver_id === user.id
          );
          
          for (const msg of messagesToDelete) {
            await apiRequest(`http://localhost:3001/messages/${msg.id}`, {
              method: 'DELETE'
            });
          }
          
          setMessageRequests(messageRequests.filter(req => req.userId !== userId));
          if (selectedUser?.id === userId) {
            setSelectedUser(null);
          }
        }
      } catch (error) {
        console.error('Error deleting messages:', error);
      }
    }
  };

  const addContact = (userId) => {
    if (!contacts.includes(userId)) {
      const newContacts = [...contacts, userId];
      setContacts(newContacts);
      saveContactsToStorage(newContacts);
      setShowAddUser(false);
      setEmailSearch('');
      setEmailSearchResults([]);
    }
  };

  const removeContact = (userId) => {
    const newContacts = contacts.filter(id => id !== userId);
    setContacts(newContacts);
    saveContactsToStorage(newContacts);
    if (selectedUser?.id === userId) {
      setSelectedUser(null);
    }
  };

  const searchUserByEmail = () => {
    if (!emailSearch.trim()) {
      setEmailSearchResults([]);
      return;
    }

    const results = allUsers.filter(u => 
      u.email.toLowerCase().includes(emailSearch.toLowerCase())
    );
    setEmailSearchResults(results);
  };

  const startEditingMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.message);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEditedMessage = async (msgId) => {
    if (!editingText.trim() || editingText === messages.find(m => m.id === msgId)?.message) {
      cancelEditing();
      return;
    }

    try {
      const response = await apiRequest(`http://localhost:3001/messages/${msgId}`, {
        method: 'PUT',
        body: JSON.stringify({ message: editingText })
      });
      
      if (response.ok) {
        fetchMessages();
        fetchLastMessagesForContacts();
        cancelEditing();
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await apiRequest(`http://localhost:3001/messages/${id}/delete`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        fetchMessages();
        fetchLastMessagesForContacts();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    let date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return "";
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (diffDays === 0) {
      return timePart;
    } else if (diffDays === 1) {
      return `Yesterday, ${timePart}`;
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString("en-US", { weekday: "long" })}, ${timePart}`;
    } else {
      return `${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}, ${timePart}`;
    }
  };

  const truncateMessage = (message, maxLength = 25) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const contactUsers = allUsers.filter(u => contacts.includes(u.id));
  const filteredContacts = contactUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRequestsCount = messageRequests.reduce((sum, req) => sum + req.unreadCount, 0);

  return (
    <>
      {/* Custom Keyframes */}
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes messageBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>

      <div className="flex h-[calc(100vh-48px)] bg-white rounded-xl overflow-hidden shadow-lg">
        {/* Sidebar */}
        <div className="w-96 border-r-2 border-blue-100 flex flex-col" style={{ animation: 'slideInLeft 0.4s ease-out' }}>
          {/* Sidebar Header */}
          <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex justify-between items-center">
            <h2 className="m-0 text-xl font-semibold flex items-center gap-2">
              <MessageSquare size={24} className="animate-bounce" /> Messages
            </h2>
            <button 
              className="bg-white/20 border border-white/30 text-white w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white/30 hover:scale-110 hover:rotate-90 active:scale-95 group relative overflow-hidden"
              onClick={() => setShowAddUser(!showAddUser)}
              title="Add Contact"
            >
              <Plus size={20} className="relative z-10 transition-transform duration-300 group-hover:rotate-180" />
              <span className="absolute inset-0 bg-white/10 rounded-full transition-transform duration-300 scale-0 group-hover:scale-100" />
            </button>
          </div>

          {/* Add User Modal */}
          {showAddUser && (
            <div 
              className="bg-white border-b-2 border-blue-100 p-4"
              style={{ animation: 'slideDown 0.3s ease-out' }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="m-0 text-base text-slate-800 font-semibold">Add Contact</h3>
                <button 
                  onClick={() => {
                    setShowAddUser(false);
                    setEmailSearch('');
                    setEmailSearchResults([]);
                  }}
                  className="bg-none border-none text-slate-500 cursor-pointer p-1 rounded transition-all duration-300 hover:bg-red-100 hover:text-red-600 hover:rotate-90 hover:scale-110 active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  onKeyUp={searchUserByEmail}
                  placeholder="Search by email..."
                  className="flex-1 p-2 border-2 border-gray-200 rounded-lg text-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:scale-[1.01]"
                />
                <button 
                  onClick={searchUserByEmail} 
                  className="bg-blue-500 text-white border-none rounded-lg px-3 cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <Search size={18} />
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {emailSearchResults.length === 0 && emailSearch && (
                  <p className="text-center text-slate-500 py-5 text-sm animate-pulse">No users found</p>
                )}
                {emailSearchResults.map((u, index) => (
              <div 
                key={u.id} 
                className="flex items-center p-3 border border-blue-100 rounded-lg mb-2 gap-3 transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:scale-[1.02]"
                style={{ animation: `slideInRight 0.3s ease-out ${index * 0.05}s backwards` }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white overflow-hidden transition-transform duration-300 hover:scale-110">
                  {u.profile_image ? (
                    <img src={`http://localhost:3001${u.profile_image.startsWith('/') ? '' : '/'}${u.profile_image}`} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 text-sm">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
                <button
                  onClick={() => addContact(u.id)}
                  className="bg-blue-500 text-white border-none rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:scale-105 hover:shadow-md active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={contacts.includes(u.id)}
                >
                  {contacts.includes(u.id) ? 'Added' : 'Add'}
                </button>
              </div>
            ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-white border-b-2 border-blue-100">
            <button 
              className={`flex-1 py-3.5 px-4 bg-transparent border-none text-slate-500 text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 relative border-b-[3px] border-transparent hover:bg-blue-50 hover:text-slate-800 ${activeTab === 'contacts' ? 'text-slate-800 border-b-blue-500 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              <User size={16} className="transition-transform duration-300 hover:scale-110" />
              Contacts
            </button>
            <button 
              className={`flex-1 py-3.5 px-4 bg-transparent border-none text-slate-500 text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 relative border-b-[3px] border-transparent hover:bg-blue-50 hover:text-slate-800 ${activeTab === 'requests' ? 'text-slate-800 border-b-blue-500 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <Clock size={16} className="transition-transform duration-300 hover:scale-110" />
              Requests
              {totalRequestsCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold py-0.5 px-1.5 rounded-xl min-w-[18px] h-[18px] flex items-center justify-center animate-bounce shadow-lg">
                  {totalRequestsCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative p-4 border-b border-blue-100 bg-white">
            <Search size={18} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-all duration-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'contacts' ? 'Search contacts...' : 'Search requests...'}
              className="w-full py-2.5 pr-10 pl-10 border-2 border-gray-200 rounded-[20px] text-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:pl-11"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-7 top-1/2 -translate-y-1/2 bg-none border-none text-slate-500 cursor-pointer p-1 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-red-100 hover:text-red-600 hover:rotate-90 hover:scale-110"
                style={{ animation: 'scaleIn 0.2s ease-out' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'contacts' ? (
              filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-15 px-5 text-slate-500 text-center" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <UserPlus size={32} className="animate-pulse" />
                  <p className="my-2">No contacts yet</p>
                  <p className="text-xs opacity-70">Click the + button to add contacts</p>
                </div>
              ) : (
                filteredContacts.map((u, index) => {
                  const lastMsg = lastMessages[u.id];
                  const unreadCount = unreadCounts[u.id] || 0;
                  const isUnread = unreadCount > 0;
                  
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center py-4 px-5 cursor-pointer transition-all duration-300 border-b border-blue-100 hover:bg-blue-50 hover:translate-x-1 group ${selectedUser?.id === u.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} ${isUnread ? 'bg-blue-50/30' : ''}`}
                      style={{ animation: `slideInLeft 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <div onClick={() => setSelectedUser(u)} className="flex items-center flex-1 cursor-pointer gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mr-3 overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative">
                          {u.profile_image ? (
                            <img src={`http://localhost:3001/${u.profile_image}`} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} />
                          )}
                          {isUnread && (
                            <div className="absolute inset-0 bg-blue-400/20 animate-ping rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-semibold text-slate-800">{u.name}</div>
                            {unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-[11px] font-bold py-0.5 px-1.5 rounded-xl min-w-[18px] h-[18px] flex items-center justify-center shadow-md animate-pulse">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {lastMsg && (
                            <div className={`text-[13px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis ${isUnread ? 'text-slate-800 font-semibold' : 'text-slate-400 font-normal'}`}>
                              <span className="font-medium mr-0.5">
                                {lastMsg.sender_id === user.id ? 'You' : u.name.split(' ')[0]}:
                              </span>
                              {' '}
                              {truncateMessage(lastMsg.message)}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Remove ${u.name} from contacts?`)) {
                            removeContact(u.id);
                          }
                        }}
                        className="bg-red-100 border-none text-red-600 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-red-200 hover:scale-125 hover:rotate-90 active:scale-95"
                        title="Remove contact"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })
              )
            ) : (
              messageRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-15 px-5 text-slate-500 text-center" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <Clock size={32} className="animate-pulse" />
                  <p className="my-2">No message requests</p>
                  <p className="text-xs opacity-70">Users not in your contacts will appear here</p>
                </div>
              ) : (
                messageRequests.map((req, index) => {
                  const reqUser = allUsers.find(u => u.id === req.userId);
                  if (!reqUser) return null;
                  
                  return (
                    <div 
                      key={req.userId} 
                      className="flex py-4 px-5 border-b border-blue-100 gap-3 bg-blue-50/30 transition-all duration-300 hover:bg-blue-50/60 hover:translate-x-1"
                      style={{ animation: `slideInLeft 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <div 
                        onClick={() => viewMessageRequest(req.userId)}
                        className="flex gap-3 cursor-pointer flex-1"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg relative">
                          {req.userImage ? (
                            <img src={`http://localhost:3001/${req.userImage}`} alt={req.userName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} />
                          )}
                          <div className="absolute inset-0 bg-blue-400/20 animate-ping rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="font-semibold text-slate-800">{req.userName}</div>
                            {req.unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-[11px] font-bold py-0.5 px-1.5 rounded-xl min-w-[18px] h-[18px] flex items-center justify-center shadow-md animate-bounce">
                                {req.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="text-[13px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-slate-800 font-semibold">
                            {truncateMessage(req.lastMessage)}
                          </div>
                          <div className="flex gap-2 mt-2.5">
                            <button 
                              className="flex-1 py-2 px-3 bg-blue-500 text-white border-none rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptMessageRequest(req.userId);
                              }}
                              >
                              Accept
                            </button>
                            <button 
                              className="flex-1 py-2 px-3 bg-red-100 text-red-600 border border-red-300 rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-red-200 hover:border-red-600 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessageRequest(req.userId);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col" style={{ animation: 'slideInRight 0.4s ease-out' }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center py-4 px-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white gap-3" style={{ animation: 'slideDown 0.3s ease-out' }}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center text-white overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-xl">
                  {selectedUser.profile_image ? (
                    <img src={`http://localhost:3001/${selectedUser.profile_image}`} alt={selectedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base">{selectedUser.name}</div>
                  <div className="text-xs opacity-90 capitalize">{selectedUser.userType}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
                {messages.map((msg, index) => (
                  <div
                      key={msg.id}
                      className={`flex flex-col mb-4 max-w-[100%] group ${msg.sender_id === user.id ? 'self-end items-end' : 'self-start items-start'}`}
                      style={{ 
                        animation: `${msg.sender_id === user.id ? 'slideInRight' : 'slideInLeft'} 0.3s ease-out ${index * 0.02}s backwards` 
                      }}
                    >
                    {editingMessageId === msg.id ? (
                      <div className="w-full" style={{ animation: 'scaleIn 0.2s ease-out' }}>
                        <textarea
                          value={editingText}
                          onChange={(e) => {
                            setEditingText(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 400) + 'px';
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEditedMessage(msg.id);
                            }
                            if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = Math.min(el.scrollHeight, 400) + 'px';
                            }
                          }}
                          autoFocus
                          className="w-full p-3 rounded-xl border-2 border-blue-500 text-sm resize-none min-h-[80px] max-h-[400px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300 focus:shadow-lg"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveEditedMessage(msg.id)}
                            className="px-4 py-1.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-1.5 bg-gray-200 text-slate-500 border-none rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-300 hover:scale-105 active:scale-95"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`py-3 px-4 rounded-xl break-words transition-all duration-300 hover:scale-[1.02] ${msg.sender_id === user.id ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-sm hover:shadow-lg' : 'bg-slate-50 text-slate-800 border border-blue-100 rounded-bl-sm hover:bg-white hover:shadow-md'}`}>
                          {msg.deleted ? (
                            <i className="text-gray-400 italic">
                              This message has been deleted
                            </i>
                          ) : (
                            msg.message
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {msg.edited === 1 && !msg.deleted && (
                            <span className="text-[11px] text-slate-400 mr-1">
                              (edited)
                            </span>
                          )}
                          {formatTime(msg.timestamp)}
                        </div>

                        {msg.sender_id === user.id && !msg.deleted && (
                          <div className="flex gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              className="bg-blue-50 border border-blue-200 cursor-pointer text-blue-600 py-1 px-2 rounded-md transition-all duration-300 hover:bg-blue-100 hover:text-blue-700 hover:scale-110 active:scale-95 flex items-center gap-1"
                              onClick={() => startEditingMessage(msg)}
                              title="Edit message"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="bg-red-50 border border-red-200 cursor-pointer text-red-600 py-1 px-2 rounded-md transition-all duration-300 hover:bg-red-100 hover:text-red-700 hover:scale-110 active:scale-95 flex items-center gap-1"
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Delete message"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="flex p-4 bg-slate-50 border-t-2 border-blue-100 gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={selectedUser.isRequest ? "Accept request to reply..." : "Type a message..."}
                  className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-3xl text-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedUser.isRequest}
                />
                <button 
                  onClick={() => sendMessage()} 
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:scale-110 hover:shadow-xl hover:rotate-12 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  disabled={selectedUser.isRequest}
                >
                  <Send size={20} className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span className="absolute inset-0 bg-white/20 rounded-full transition-transform duration-300 scale-0 group-hover:scale-100" style={{ animation: 'ripple 0.6s ease-out' }} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4" style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <User size={64} className="animate-pulse" />
              <p className="animate-pulse">Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}