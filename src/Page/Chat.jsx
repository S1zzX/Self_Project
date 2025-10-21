import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Search, X, Plus, UserPlus, Clock, Edit2, Trash2, MessageSquare, MessageCircle, Shield, ShieldOff } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useSocket } from '../SocketContext';

export default function Chat({ user }) {
  const { apiRequest, isAdmin } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
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
  const [contactRequests, setContactRequests] = useState([]);
  const [waitingMessages, setWaitingMessages] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedByOthers, setBlockedByOthers] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingMessageUser, setPendingMessageUser] = useState(null);
  const [activeTab, setActiveTab] = useState('contacts');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const messagesEndRef = useRef(null);

  // Initial load - fetch all data from database ONCE
  useEffect(() => {
    if (!socket || !isConnected) return;

    fetchAllUsers();
    fetchContacts();
    fetchSentRequests();
    fetchContactRequests();
    fetchBlockedUsers();
    fetchBlockedByOthers();
  }, [socket, isConnected]);

  // Fetch related data when contacts change
  useEffect(() => {
    if (contacts.length > 0) {
      fetchLastMessagesForContacts();
    }
  }, [contacts]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    socket.on('new_message', (messageData) => {
      console.log('📨 New message received:', messageData);
      
      if (selectedUser && selectedUser.id === messageData.sender_id) {
        setMessages(prev => [...prev, messageData]);
        socket.emit('mark_read', { senderId: messageData.sender_id });
        setTimeout(scrollToBottom, 100);
      }
      
      fetchLastMessagesForContacts();
      fetchWaitingMessages();
    });

    // Listen for message sent confirmation
    socket.on('message_sent', (messageData) => {
      console.log('✅ Message sent confirmed:', messageData);
      
      if (selectedUser && selectedUser.id === messageData.receiver_id) {
        setMessages(prev => {
          if (prev.some(msg => msg.id === messageData.id)) {
            return prev;
          }
          return [...prev, messageData];
        });
        setTimeout(scrollToBottom, 100);
      }
      
      fetchLastMessagesForContacts();
    });

    // Listen for message edits
    socket.on('message_edited', (data) => {
      console.log('✏️ Message edited:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, message: data.message, edited: data.edited }
          : msg
      ));
      
      fetchLastMessagesForContacts();
    });

    // Listen for message deletes
    socket.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, deleted: 1 }
          : msg
      ));
      
      fetchLastMessagesForContacts();
    });

    // Listen for new contact requests
    socket.on('new_contact_request', (data) => {
      console.log('📬 New contact request:', data);
      fetchContactRequests();
    });

    // Listen for contact request approved
    socket.on('contact_request_approved', (data) => {
      console.log('✅ Contact request approved:', data);
      fetchContacts();
      fetchSentRequests();
      fetchContactRequests();
      fetchWaitingMessages();
    });

    // Listen for message notifications
    socket.on('message_notification', (data) => {
      console.log('🔔 Message notification:', data);
      fetchLastMessagesForContacts();
      fetchWaitingMessages();
    });

    // Listen for contact request declined confirmation
    socket.on('contact_request_declined_confirmed', (data) => {
      console.log('📪 Contact request declined:', data);
      fetchSentRequests();
    });

    // Listen for waiting message removed confirmation
    socket.on('waiting_message_removed', (data) => {
      console.log('🗑️ Waiting message removed:', data);
    });

    // Listen for user blocked
    socket.on('user_blocked', (data) => {
      console.log('🚫 User blocked:', data);
      fetchBlockedUsers();
      fetchWaitingMessages();
      if (selectedUser && selectedUser.id === data.blockedUser.id) {
        setSelectedUser(null);
      }
    });

    // Listen for user unblocked - UPDATED
    socket.on('user_unblocked', (data) => {
      console.log('✅ User unblocked:', data);
      fetchBlockedUsers();
      
      // Refresh search if modal is open
      if (showAddUser && emailSearch) {
        setTimeout(() => {
          searchUserByEmail();
        }, 300);
      }
    });

    // Listen for being blocked by someone
    socket.on('you_were_blocked', (data) => {
      console.log('🚫 You were blocked by:', data.blockedBy);
      fetchBlockedByOthers();
      if (showAddUser && emailSearch) {
        searchUserByEmail();
      }
    });

    // Listen for being unblocked by someone - NEW
    socket.on('you_were_unblocked', (data) => {
      console.log('✅ You were unblocked by:', data.unblockedBy);
      fetchBlockedByOthers();
      
      // Refresh search if modal is open
      if (showAddUser && emailSearch) {
        setTimeout(() => {
          searchUserByEmail();
        }, 300);
      }
    });

    // Listen for contact removed
    socket.on('contact_removed', (data) => {
      console.log('👋 Contact removed:', data);
      fetchContacts();
      fetchSentRequests();
      if (selectedUser && selectedUser.id === data.removedBy) {
        setSelectedUser(null);
      }
    });

    // Typing indicators
    socket.on('user_typing', (data) => {
      if (selectedUser && selectedUser.id === data.userId) {
        console.log(`${data.userId} is typing...`);
      }
    });

    socket.on('user_stopped_typing', (data) => {
      if (selectedUser && selectedUser.id === data.userId) {
        console.log(`${data.userId} stopped typing`);
      }
    });

    // Cleanup listeners
    return () => {
      socket.off('new_message');
      socket.off('message_sent');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('new_contact_request');
      socket.off('contact_request_approved');
      socket.off('message_notification');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('contact_request_declined_confirmed');
      socket.off('user_blocked');
      socket.off('user_unblocked');
      socket.off('you_were_blocked');
      socket.off('you_were_unblocked');
      socket.off('contact_removed');
      socket.off('waiting_message_removed');
    };
  }, [socket, isConnected, selectedUser, showAddUser, emailSearch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch contacts from Socket.IO
  const fetchContacts = () => {
    if (!socket || !isConnected) return;
    socket.emit('get_contacts');
  };

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleContacts = (data) => {
      console.log('📥 Received contacts:', data);
      if (data && Array.isArray(data.contacts)) {
        setContacts(data.contacts);
      } else {
        setContacts([]);
      }
    };
    socket.on('contacts', handleContacts);
    return () => {
      socket.off('contacts', handleContacts);
    };
  }, [socket, isConnected]);

  // Fetch sent contact requests from Socket.IO
  const fetchSentRequests = () => {
    if (!socket || !isConnected) return;
    socket.emit('get_sent_requests');
  };

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleSentRequests = (data) => {
      console.log('📥 Received sent requests:', data);
      if (data && Array.isArray(data.sentRequests)) {
        const sentRequestIds = data.sentRequests
          .filter(req => req.status === 'pending')
          .map(req => req.receiver_id);
        setSentRequests(sentRequestIds);
      } else {
        setSentRequests([]);
      }
    };
    socket.on('sent_requests', handleSentRequests);
    return () => {
      socket.off('sent_requests', handleSentRequests);
    };
  }, [socket, isConnected]);

  // Fetch blocked users from Socket.IO with fallback
  const fetchBlockedUsers = async () => {
    if (socket && isConnected) {
      socket.emit('get_blocked_users');
    } else {
      try {
        const response = await apiRequest('http://localhost:3001/blocked-users');
        if (response.ok) {
          const data = await response.json();
          setBlockedUsers(data);
        } else {
          setBlockedUsers([]);
        }
      } catch (error) {
        console.error('Error fetching blocked users (REST API):', error);
        setBlockedUsers([]);
      }
    }
  };

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleBlockedUsers = (data) => {
      console.log('📥 Received blocked users:', data);
      if (data && Array.isArray(data.blockedUsers)) {
        setBlockedUsers(data.blockedUsers);
        console.log('✅ Blocked users state updated:', data.blockedUsers);
      } else {
        setBlockedUsers([]);
        console.log('⚠️ No blocked users or invalid data');
      }
    };
    socket.on('blocked_users', handleBlockedUsers);
    return () => {
      socket.off('blocked_users', handleBlockedUsers);
    };
  }, [socket, isConnected]);

  // Fetch users who blocked me
  const fetchBlockedByOthers = async () => {
    try {
      const response = await apiRequest('http://localhost:3001/blocked-by-others');
      if (response.ok) {
        const data = await response.json();
        setBlockedByOthers(data.map(u => u.id));
        console.log('📥 Users who blocked me:', data.map(u => u.id));
      } else {
        setBlockedByOthers([]);
      }
    } catch (error) {
      console.error('Error fetching blocked-by-others:', error);
      setBlockedByOthers([]);
    }
  };

  // Fetch all users from Socket.IO
  const fetchAllUsers = () => {
    if (!socket || !isConnected) return;
    socket.emit('get_all_users');
  };

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleAllUsers = (data) => {
      console.log('📥 Received all users:', data);
      if (data && Array.isArray(data.users)) {
        setAllUsers(data.users);
        if (data.users.length > 0) {
          fetchWaitingMessages();
        }
      } else {
        setAllUsers([]);
        fetchWaitingMessages();
      }
    };
    socket.on('all_users', handleAllUsers);
    return () => {
      socket.off('all_users', handleAllUsers);
    };
  }, [socket, isConnected]);

  // Fetch contact requests from Socket.IO
  const fetchContactRequests = () => {
    if (!socket || !isConnected) return;
    socket.emit('get_contact_requests');
  };

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleContactRequests = (data) => {
      console.log('📥 Received contact requests:', data);
      if (data && Array.isArray(data.contactRequests)) {
        setContactRequests(data.contactRequests);
      } else {
        setContactRequests([]);
      }
    };
    socket.on('contact_requests', handleContactRequests);
    return () => {
      socket.off('contact_requests', handleContactRequests);
    };
  }, [socket, isConnected]);

  // Fetch waiting messages from Socket.IO
  const fetchWaitingMessages = () => {
    if (!socket || !isConnected) return;
    socket.emit('get_waiting_messages');
  };

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleWaitingMessages = (data) => {
      console.log('📥 Received waiting messages:', data);
      if (data && Array.isArray(data.waitingMessages)) {
        setWaitingMessages(data.waitingMessages);
      } else {
        setWaitingMessages([]);
      }
    };
    socket.on('waiting_messages', handleWaitingMessages);
    return () => {
      socket.off('waiting_messages', handleWaitingMessages);
    };
  }, [socket, isConnected]);

  // Fetch last messages for contacts from Socket.IO
  const fetchLastMessagesForContacts = () => {
    if (!socket || !isConnected || !contacts.length) return;
    const contactIds = contacts.map(c => c.id);
    socket.emit('get_last_messages', contactIds);
  };

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleLastMessages = (data) => {
      console.log('📥 Received last messages:', data);
      if (data && data.lastMessages && data.unreadCounts) {
        setLastMessages(data.lastMessages);
        setUnreadCounts(data.unreadCounts);
      } else {
        setLastMessages({});
        setUnreadCounts({});
      }
    };
    socket.on('last_messages', handleLastMessages);
    return () => {
      socket.off('last_messages', handleLastMessages);
    };
  }, [socket, isConnected]);

  // Fetch messages from Socket.IO
  const fetchMessages = () => {
    if (!selectedUser || !socket || !isConnected) return;
    socket.emit('get_messages', selectedUser.id);
  };

  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleMessages = (data) => {
      console.log('📥 Received messages:', data);
      if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setTimeout(scrollToBottom, 100);
        fetchLastMessagesForContacts();
      } else {
        setMessages([]);
      }
    };
    socket.on('messages', handleMessages);
    return () => {
      socket.off('messages', handleMessages);
    };
  }, [socket, isConnected]);

  const sendMessage = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!newMessage.trim() || !selectedUser || selectedUser.isRequest || !socket || !isConnected) return;

    socket.emit('mark_read', { senderId: selectedUser.id });
    socket.emit('send_message', {
      receiver_id: selectedUser.id,
      message: newMessage
    });

    setNewMessage('');
  };

  const viewMessageRequest = (userId) => {
    const requestedUser = allUsers.find(u => u.id === userId);
    if (requestedUser) {
      setSelectedUser({ ...requestedUser, isRequest: true });
    }
  };

  const acceptContactRequest = async (requestId, senderId) => {
    try {
      const response = await apiRequest(`http://localhost:3001/contact-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' })
      });

      if (response.ok) {
        await fetchContactRequests();
        await new Promise(resolve => setTimeout(resolve, 100));
        await fetchContacts();
        await fetchSentRequests();
        await fetchWaitingMessages();
        
        if (socket && isConnected) {
          socket.emit('contact_request_accepted', { senderId });
        }
        
        setActiveTab('contacts');
        const requestedUser = allUsers.find(u => u.id === senderId);
        if (requestedUser) {
          setSelectedUser(requestedUser);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to accept contact request');
      }
    } catch (error) {
      console.error('Error accepting contact request:', error);
      alert('Failed to accept contact request');
    }
  };

  const sendContactRequest = async (userId) => {
    try {
      if (!contacts.some(c => c.id === userId)) {
        const response = await apiRequest('http://localhost:3001/contact-requests', {
          method: 'POST',
          body: JSON.stringify({ receiver_id: userId })
        });

        if (response.ok) {
          const data = await response.json();
          await fetchSentRequests();
        if (socket && isConnected) {
            socket.emit('contact_request_sent', { 
              receiverId: userId,
              requestId: data.id 
            });
          }
          
          alert('Contact request sent!');
          setShowAddUser(false);
          setEmailSearch('');
          setEmailSearchResults([]);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to send contact request');
        }
      }
    } catch (error) {
      console.error('Error sending contact request:', error);
      alert('Failed to send contact request');
    }
  };

  const removeContact = async (userId) => {
    if (window.confirm('Remove this contact? You will no longer see your conversation history, but they will still have access to all messages.')) {
      try {
        const response = await apiRequest(`http://localhost:3001/contacts/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchContacts();
          await fetchSentRequests();
          
          if (selectedUser?.id === userId) {
            setSelectedUser(null);
          }

          setMessages([]);
          setLastMessages(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
          setUnreadCounts(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
          
          await fetchWaitingMessages();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to remove contact');
        }
      } catch (error) {
        console.error('Error removing contact:', error);
        alert('Failed to remove contact');
      }
    }
  };

  const blockUser = async (userId) => {
    if (!socket || !isConnected) {
      alert('Cannot block user: Not connected to server');
      return;
    }

    if (window.confirm('Block this user? They will not be able to send you messages.')) {
      socket.emit('block_user', { blockedUserId: userId });
      
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      
      setWaitingMessages(prev => prev.filter(msg => msg.sender_id !== userId));
      
      setTimeout(() => {
        fetchBlockedUsers();
      }, 300);
    }
  };

  const unblockUser = async (userId) => {
    if (!socket || !isConnected) {
      alert('Cannot unblock user: Not connected to server');
      return;
    }

    if (window.confirm('Unblock this user?')) {
      socket.emit('unblock_user', { blockedUserId: userId });
      
      // Refresh search if modal is open
      if (showAddUser && emailSearch) {
        setTimeout(() => {
          searchUserByEmail();
        }, 300);
      }
    }
  };

  const openChatWithUser = (targetUser) => {
    const isContact = contacts.some(c => c.id === targetUser.id);
    
    if (isContact) {
      setSelectedUser(targetUser);
    } else {
      const isBlocked = blockedUsers.some(b => b.id === targetUser.id);
      if (isBlocked) {
        alert('This user is blocked. Unblock them first to chat.');
        return;
      }
      
      setSelectedUser({ ...targetUser, isWaiting: true });
      setPendingMessageUser(targetUser);
      setShowWarningModal(true);
    }
    
    setShowAddUser(false);
    setEmailSearch('');
    setEmailSearchResults([]);
  };

  const handleSelectUser = (contact) => {
    setSelectedUser(contact);
    
    if (socket && isConnected && unreadCounts[contact.id] > 0) {
      socket.emit('mark_read', { senderId: contact.id });
      
      setUnreadCounts(prev => ({
        ...prev,
        [contact.id]: 0
      }));
    }
  };

  const searchUserByEmail = () => {
    if (!emailSearch.trim()) {
      setEmailSearchResults([]);
      return;
    }

    const results = allUsers.filter(u =>
      u.email.toLowerCase().includes(emailSearch.toLowerCase()) &&
      !blockedByOthers.includes(u.id) &&
      !blockedUsers.some(b => b.id === u.id)
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

    if (socket && isConnected) {
      socket.emit('edit_message', {
        messageId: msgId,
        newMessage: editingText
      });
      cancelEditing();
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    if (socket && isConnected) {
      socket.emit('delete_message', { messageId: id });
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

  const filteredContacts = contacts.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRequestsCount = contactRequests.filter(req => !blockedUsers.some(b => b.id === req.sender_id)).length;
  const totalWaitingCount = waitingMessages.length;

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

      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 min-w-[384px] bg-white border-r-2 border-blue-200 flex flex-col" style={{ animation: 'slideInLeft 0.4s ease-out' }}>
          {/* Sidebar Header */}
          <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="flex items-center gap-3 relative z-10">
              <h2 className="m-0 text-xl font-semibold flex items-center gap-2">
                <MessageSquare size={24} className="animate-bounce" /> Messages
              </h2>
              <div className="flex items-center gap-1.5" title={isConnected ? 'Connected' : 'Disconnected'}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-xs opacity-75">{isConnected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
            <button 
              className="bg-white/20 border border-white/30 text-white w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-white/30 hover:scale-110 hover:rotate-90 active:scale-95 group relative overflow-hidden z-10"
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
                {emailSearchResults.map((u, index) => {
                  const incomingRequest = contactRequests.find(req => req.sender_id === u.id);
                  const isBlocked = blockedUsers.some(b => b.id === u.id);
                  
                  return (
                    <div 
                      key={u.id} 
                      className="flex items-center p-3 border border-blue-100 rounded-lg mb-2 gap-3 transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:scale-[1.02]"
                      style={{ animation: `slideInRight 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white overflow-hidden transition-transform duration-300 hover:scale-110 relative">
                        {u.profile_image ? (
                          <img src={`http://localhost:3001${u.profile_image.startsWith('/') ? '' : '/'}${u.profile_image}`} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} />
                        )}
                        {isBlocked && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <ShieldOff size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div 
                          className="font-semibold text-slate-800 text-sm cursor-pointer hover:text-blue-600 transition-colors duration-200"
                          onClick={() => !isBlocked && openChatWithUser(u)}
                          title={isBlocked ? "Blocked user" : "Click to open chat"}
                        >
                          {u.name} {!isBlocked && '💬'}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                        {isBlocked && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold py-0.5 px-2 rounded-full mt-1 inline-block shadow-sm">
                            BLOCKED
                          </span>
                        )}
                        {!isBlocked && incomingRequest && (
                          <span className="bg-slate-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full mt-1 inline-block shadow-sm">
                            REQUEST SENT
                          </span>
                        )}
                      </div>
                      
                      {isBlocked ? (
                        <button
                          onClick={() => unblockUser(u.id)}
                          className="bg-blue-500 text-white border-none rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:scale-105 hover:shadow-md active:scale-95 flex items-center gap-1"
                        >
                          <Shield size={14} />
                          Unblock
                        </button>
                      ) : incomingRequest ? (
                        <div className="flex gap-2">
                          <button 
                            className="py-1.5 px-3 bg-blue-500 text-white border-none rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:scale-105 active:scale-95"
                            onClick={async () => {
                              await acceptContactRequest(incomingRequest.id, u.id);
                              setShowAddUser(false);
                              setEmailSearch('');
                              setEmailSearchResults([]);
                            }}
                          >
                            Accept
                          </button>
                          <button 
                            className="py-1.5 px-3 bg-red-100 text-red-600 border border-red-300 rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-red-200 hover:border-red-600 hover:scale-105 active:scale-95"
                            onClick={async () => {
                              try {
                                const response = await apiRequest(`http://localhost:3001/contact-requests/${incomingRequest.id}`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ status: 'declined' })
                                });
                                
                                if (response.ok) {
                                  if (socket && isConnected) {
                                    socket.emit('contact_request_declined', { requestId: incomingRequest.id });
                                  }
                                  await fetchContactRequests();
                                  await fetchSentRequests();
                                  searchUserByEmail();
                                }
                              } catch (error) {
                                console.error('Error declining request:', error);
                              }
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const isContact = contacts.some(c => c.id === u.id);
                            if (isContact || sentRequests.includes(u.id)) {
                              return;
                            }
                            sendContactRequest(u.id);
                          }}
                          className="bg-blue-500 text-white border-none rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:scale-105 hover:shadow-md active:scale-95 disabled:bg-slate-600 disabled:text-white disabled:cursor-not-allowed disabled:opacity-100"
                          disabled={contacts.some(c => c.id === u.id) || sentRequests.includes(u.id)}
                        >
                          {contacts.some(c => c.id === u.id) ? 'Added' : sentRequests.includes(u.id) ? 'Request Sent' : 'Add Contact'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-white border-b-2 border-blue-100">
            <button 
              className={`flex-1 py-2.5 px-3 bg-transparent border-none text-slate-500 text-xs font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-1.5 relative border-b-[3px] border-transparent hover:bg-blue-50 hover:text-slate-800 ${activeTab === 'contacts' ? 'text-slate-800 border-b-blue-500 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              <User size={14} className="transition-transform duration-300 hover:scale-110" />
              Contacts
            </button>
            <button 
              className={`flex-1 py-2.5 px-3 bg-transparent border-none text-slate-500 text-xs font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-1.5 relative border-b-[3px] border-transparent hover:bg-blue-50 hover:text-slate-800 ${activeTab === 'requests' ? 'text-slate-800 border-b-blue-500 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <Clock size={14} className="transition-transform duration-300 hover:scale-110" />
              Requests
              {totalRequestsCount > 0 && (
                <span className="bg-red-600 text-white text-[9px] font-bold py-0.5 px-1 rounded-xl min-w-[16px] h-[16px] flex items-center justify-center animate-bounce shadow-lg">
                  {totalRequestsCount}
                </span>
              )}
            </button>
            <button 
              className={`flex-1 py-2.5 px-3 bg-transparent border-none text-slate-500 text-xs font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-1.5 relative border-b-[3px] border-transparent hover:bg-blue-50 hover:text-slate-800 ${activeTab === 'waiting' ? 'text-slate-800 border-b-blue-500 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('waiting')}
            >
              <MessageCircle size={14} className="transition-transform duration-300 hover:scale-110" />
              Waiting
              {totalWaitingCount > 0 && (
                <span className="bg-orange-600 text-white text-[9px] font-bold py-0.5 px-1 rounded-xl min-w-[16px] h-[16px] flex items-center justify-center animate-bounce shadow-lg">
                  {totalWaitingCount}
                </span>
              )}
            </button>
            <button 
              className={`flex-1 py-2.5 px-3 bg-transparent border-none text-slate-500 text-xs font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-1.5 relative border-b-[3px] border-transparent hover:bg-blue-50 hover:text-slate-800 ${activeTab === 'blocked' ? 'text-slate-800 border-b-blue-500 bg-blue-50' : ''}`}
              onClick={() => setActiveTab('blocked')}
            >
              <ShieldOff size={14} className="transition-transform duration-300 hover:scale-110" />
              Blocked
              {blockedUsers.length > 0 && (
                <span className="bg-gray-600 text-white text-[9px] font-bold py-0.5 px-1 rounded-xl min-w-[16px] h-[16px] flex items-center justify-center shadow-lg">
                  {blockedUsers.length}
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
              placeholder={activeTab === 'contacts' ? 'Search contacts...' : activeTab === 'requests' ? 'Search requests...' : activeTab === 'blocked' ? 'Search blocked users...' : 'Search waiting messages...'}
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
                  const isOnline = onlineUsers.includes(u.id);
                  
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center py-4 px-5 cursor-pointer transition-all duration-300 border-b border-blue-100 hover:bg-blue-50 hover:translate-x-1 group ${selectedUser?.id === u.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} ${isUnread ? 'bg-blue-50/30' : ''}`}
                      style={{ animation: `slideInLeft 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <div onClick={() => handleSelectUser(u)} className="flex items-center flex-1 cursor-pointer gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mr-3 overflow-visible transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative">
                          {u.profile_image ? (
                            <img src={`http://localhost:3001/${u.profile_image}`} alt={u.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <User size={24} />
                          )}
                          {isUnread && (
                            <div className="absolute inset-0 bg-blue-400/20 animate-ping rounded-full" />
                          )}
                          {isOnline ? (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-20" />
                          ) : (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full z-20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {u.name}
                              {isOnline ? (
                                <span className="text-[10px] text-green-600 font-normal">• Online</span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-normal">• Offline</span>
                              )}
                            </div>
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
            ) : activeTab === 'requests' ? (
              contactRequests.filter(req => !blockedUsers.some(b => b.id === req.sender_id)).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-15 px-5 text-slate-500 text-center" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <Clock size={32} className="animate-pulse" />
                  <p className="my-2">No requests</p>
                  <p className="text-xs opacity-70">Contact requests will appear here</p>
                </div>
              ) : (
                contactRequests.filter(req => !blockedUsers.some(b => b.id === req.sender_id)).map((req, index) => {
                  return (
                    <div 
                      key={`contact-${req.sender_id}`} 
                      className="flex py-4 px-5 border-b border-blue-100 gap-3 bg-blue-50/30 transition-all duration-300 hover:bg-blue-50/60 hover:translate-x-1"
                      style={{ animation: `slideInLeft 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <div className="flex gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg relative">
                          {req.sender_image ? (
                            <img src={`http://localhost:3001/${req.sender_image}`} alt={req.sender_name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} />
                          )}
                          <div className="absolute inset-0 bg-blue-400/20 animate-ping rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="font-semibold text-slate-800">{req.sender_name}</div>
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold py-0.5 px-2 rounded-full">
                              CONTACT REQUEST
                            </span>
                          </div>
                          <div className="text-[13px] leading-tight text-slate-600">
                            Wants to add you as a contact
                          </div>
                          <div className="text-[11px] text-slate-400 mb-2">
                            {formatTime(req.created_at)}
                          </div>
                          <div className="flex gap-2 mt-2.5">
                            <button 
                              className="flex-1 py-2 px-3 bg-blue-500 text-white border-none rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptContactRequest(req.id, req.sender_id);
                              }}
                            >
                              Accept
                            </button>
                            <button 
                              className="flex-1 py-2 px-3 bg-red-100 text-red-600 border border-red-300 rounded-md text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-red-200 hover:border-red-600 hover:-translate-y-1 hover:shadow-lg active:scale-95"
                              onClick={async (e) => {
                                e.stopPropagation();
                                
                                try {
                                  const response = await apiRequest(`http://localhost:3001/contact-requests/${req.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ status: 'declined' })
                                  });
                                  
                                  if (response.ok) {
                                    if (socket && isConnected) {
                                      socket.emit('contact_request_declined', { requestId: req.id });
                                    }
                                    setContactRequests(prev => prev.filter(r => r.id !== req.id));
                                    await fetchSentRequests();
                                  } else {
                                    const error = await response.json();
                                    alert(error.error || 'Failed to decline request');
                                  }
                                } catch (error) {
                                  console.error('Error declining request:', error);
                                  alert('Failed to decline request');
                                }
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : activeTab === 'waiting' ? (
              waitingMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-15 px-5 text-slate-500 text-center" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <MessageCircle size={32} className="animate-pulse" />
                  <p className="my-2">No waiting messages</p>
                  <p className="text-xs opacity-70">Messages from non-contacts will appear here for viewing</p>
                </div>
              ) : (
                waitingMessages.map((msg, index) => {
                  const msgUser = allUsers.find(u => u.id == msg.userId);
                  const isBlockedByThem = blockedByOthers.includes(msg.userId);
                  
                  return (
                    <div 
                      key={msg.userId} 
                      className="flex items-center py-4 px-5 border-b border-orange-100 gap-3 bg-orange-50/30 transition-all duration-300 hover:bg-orange-50/60 hover:translate-x-1 group"
                      style={{ animation: `slideInLeft 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <div 
                        className="flex gap-3 flex-1 cursor-pointer"
                        onClick={() => viewMessageRequest(msg.userId)}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg relative">
                          {msgUser.profile_image ? (
                            <img src={`http://localhost:3001/${msgUser.profile_image}`} alt={msgUser.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} />
                          )}
                          {isBlockedByThem ? (
                            <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                              <ShieldOff size={20} className="text-white" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-orange-400/20 animate-ping rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="font-semibold text-slate-800">
                              {msgUser.name} <span className="text-gray-400 font-normal text-xs">({msgUser.email})</span>
                            </div>
                            {msg.unreadCount > 0 && !isBlockedByThem && (
                              <span className="bg-orange-600 text-white text-[11px] font-bold py-0.5 px-1.5 rounded-xl min-w-[18px] h-[18px] flex items-center justify-center shadow-md animate-bounce">
                                {msg.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="text-[13px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-slate-800 font-semibold">
                            {truncateMessage(msg.lastMessage)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {formatTime(msg.timestamp)}
                          </div>
                          {isBlockedByThem ? (
                            <div className="text-[11px] text-red-600 font-bold italic mt-1 flex items-center gap-1">
                              <ShieldOff size={12} />
                              This user has blocked you
                            </div>
                          ) : (
                            <div className="text-[11px] text-orange-600 italic mt-1">
                              Click to view • Can't reply (not a contact)
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          blockUser(msg.userId);
                        }}
                        className="bg-red-100 border border-red-300 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-red-200 hover:scale-105 active:scale-95 flex items-center gap-1"
                        title="Block user"
                      >
                        <ShieldOff size={14} />
                        Block
                      </button>
                    </div>
                  );
                })
              )
            ) : activeTab === 'blocked' ? (
              blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-15 px-5 text-slate-500 text-center" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <ShieldOff size={32} className="animate-pulse" />
                  <p className="my-2">No blocked users</p>
                  <p className="text-xs opacity-70">Users you block will appear here</p>
                </div>
              ) : (
                blockedUsers
                  .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((u, index) => (
                    <div 
                      key={u.id} 
                      className="flex items-center py-4 px-5 border-b border-gray-200 gap-3 transition-all duration-300 hover:bg-gray-50"
                      style={{ animation: `slideInLeft 0.3s ease-out ${index * 0.05}s backwards` }}
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white overflow-hidden relative">
                        {u.profile_image ? (
                          <img src={`http://localhost:3001/${u.profile_image}`} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <ShieldOff size={20} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Blocked {formatTime(u.blocked_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => unblockUser(u.id)}
                        className="bg-blue-500 text-white border-none rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:scale-105 hover:shadow-lg active:scale-95 flex items-center gap-2"
                      >
                        <Shield size={14} />
                        Unblock
                      </button>
                    </div>
                  ))
              )
            ) : null}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white" style={{ animation: 'slideInRight 0.4s ease-out' }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center py-3.5 px-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white gap-3 relative overflow-hidden" style={{ animation: 'slideDown 0.3s ease-out' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white overflow-visible transition-all duration-300 hover:scale-110 hover:shadow-xl relative z-10">
                  {selectedUser.profile_image ? (
                    <img src={`http://localhost:3001/${selectedUser.profile_image}`} alt={selectedUser.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User size={24} />
                  )}
                  {onlineUsers.includes(selectedUser.id) ? (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-20" />
                  ) : (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-400 border-2 border-white rounded-full z-20" />
                  )}
                </div>
                <div className="flex-1 relative z-10">
                  <div className="font-semibold text-base flex items-center gap-2">
                    {selectedUser.name}
                    {onlineUsers.includes(selectedUser.id) ? (
                      <span className="text-xs font-normal bg-green-500/20 px-2 py-0.5 rounded-full">Online</span>
                    ) : (
                      <span className="text-xs font-normal bg-gray-400/20 px-2 py-0.5 rounded-full">Offline</span>
                    )}
                  </div>
                  <div className="text-xs opacity-90 capitalize">{selectedUser.userType}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-100">
                {selectedUser.isDeleted ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md text-center shadow-lg">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-red-600 mb-2">User Deleted</h3>
                      <p className="text-slate-700 mb-4">
                        This user has been deleted. You can not chat with this user anymore.
                      </p>
                      <p className="text-sm text-slate-500">
                        All messages from this user have been permanently removed from the database.
                      </p>
                    </div>
                  </div>
                ) : blockedByOthers.includes(selectedUser.id) ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-8 max-w-md text-center shadow-lg">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldOff size={32} className="text-orange-600" />
                      </div>
                      <h3 className="text-xl font-bold text-orange-600 mb-2">User Has Blocked You</h3>
                      <p className="text-slate-700 mb-4">
                        <strong>{selectedUser.name}</strong> has blocked you. You cannot send or receive messages from this user.
                      </p>
                      <p className="text-sm text-slate-500">
                        You can view previous messages, but you cannot reply or send new messages.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
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
                          <div className={`py-3 px-4 rounded-xl break-words transition-all duration-300 hover:scale-[1.02] ${msg.sender_id === user.id ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-sm hover:shadow-lg' : 'bg-white text-slate-800 border border-blue-200 rounded-bl-sm hover:bg-blue-50 hover:shadow-md'}`}>
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
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="flex p-4 bg-white border-t-2 border-blue-200 gap-3 shadow-inner">
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
                  placeholder={
                    selectedUser.isDeleted 
                      ? "User has been deleted..." 
                      : blockedByOthers.includes(selectedUser.id)
                      ? "This user has blocked you..."
                      : selectedUser.isRequest 
                      ? "Accept request to reply..." 
                      : "Type a message..."
                  }
                  className="flex-1 py-3 px-4 border-2 border-gray-200 rounded-3xl text-sm outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedUser.isRequest || selectedUser.isDeleted || blockedByOthers.includes(selectedUser.id)}
                />
                <button 
                  onClick={() => sendMessage()} 
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none cursor-pointer flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:scale-110 hover:shadow-xl hover:rotate-12 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  disabled={selectedUser.isRequest || selectedUser.isDeleted || blockedByOthers.includes(selectedUser.id)}
                >
                  <Send size={20} className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <span className="absolute inset-0 bg-white/20 rounded-full transition-transform duration-300 scale-0 group-hover:scale-100" style={{ animation: 'ripple 0.6s ease-out' }} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 bg-gray-100" style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-dashed border-blue-200 flex flex-col items-center gap-4">
                <User size={64} className="animate-pulse text-blue-400" />
                <p className="animate-pulse text-lg font-medium">Select a user to start chatting</p>
                <p className="text-sm text-slate-400">Choose a contact from the sidebar to begin your conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Modal for Non-Contact Messages */}
      {showWarningModal && pendingMessageUser && (
        <>
          <div
            onClick={() => {
              setShowWarningModal(false);
              setPendingMessageUser(null);
              setSelectedUser(null);
            }}
            className="fixed inset-0 bg-black/50 z-[1000] backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] bg-white rounded-2xl shadow-2xl p-8 max-w-md w-[90%]"
            style={{ animation: 'scaleIn 0.3s ease-out' }}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <MessageCircle size={32} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 m-0">
                Message from Non-Contact
              </h3>
              <p className="text-slate-600 m-0">
                <strong>{pendingMessageUser.name}</strong> ({pendingMessageUser.email}) is not in your contacts.
              </p>
              <p className="text-sm text-slate-500 m-0">
                Do you want to accept messages from this user?
              </p>
              
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    setPendingMessageUser(null);
                  }}
                  className="flex-1 py-3 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
                >
                  Yes, Allow
                </button>
                <button
                  onClick={() => {
                    blockUser(pendingMessageUser.id);
                    setShowWarningModal(false);
                    setPendingMessageUser(null);
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-3 px-6 bg-red-500 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-red-600 hover:scale-105 hover:shadow-xl active:scale-95"
                >
                  No, Block
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setPendingMessageUser(null);
                  setSelectedUser(null);
                }}
                className="mt-2 text-sm text-slate-400 hover:text-slate-600 cursor-pointer bg-none border-none transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}