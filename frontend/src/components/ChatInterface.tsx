import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../api';
import { Message, Room, AuthUser } from '../types/chat';

const SOCKET_URL = 'http://localhost:3000';

export const ChatInterface: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedRoomRef = useRef<Room | null>(null);

  // Keep ref in sync with state for use in socket callbacks
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // Rejoin room after reconnection
  const rejoinRoom = useCallback((sock: Socket) => {
    const room = selectedRoomRef.current;
    if (room && authUser) {
      console.log(`[Reconnect] Rejoining room: ${room.id}`);
      sock.emit('joinRoom', { roomId: room.id, userId: authUser.id });
      // Refresh messages
      api.getMessages(room.id).then(setMessages).catch(console.error);
    }
  }, [authUser]);

  // 1. Initialize API and Socket with reconnection logic (#13)
  useEffect(() => {
    // Fetch initial rooms
    api.getRooms().then(setRooms).catch(console.error);

    // Connect to Socket with reconnection options
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    // Connection status handlers
    newSocket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnectionStatus('connected');
      // Rejoin room if we were in one
      rejoinRoom(newSocket);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setConnectionStatus('disconnected');
    });

    newSocket.on('reconnecting', (attemptNumber) => {
      console.log(`[Socket] Reconnecting... Attempt ${attemptNumber}`);
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [rejoinRoom]);

  // 2. Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const messageHandler = (message: Message) => {
      // Only append if it belongs to current room
      if (selectedRoom && message.roomId === selectedRoom.id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const roomUpdatedHandler = (room: Room) => {
      setRooms((prev) => prev.map((r) => r.id === room.id ? room : r));
      if (selectedRoom?.id === room.id) {
        setSelectedRoom(room);
      }
    };

    const roomDeletedHandler = (data: { roomId: string }) => {
      setRooms((prev) => prev.filter((r) => r.id !== data.roomId));
      if (selectedRoom?.id === data.roomId) {
        setSelectedRoom(null);
        setMessages([]);
      }
    };

    const activeUsersHandler = (data: { roomId: string; users: string[] }) => {
      if (selectedRoom?.id === data.roomId) {
        setActiveUsers(data.users);
      }
    };

    socket.on('receiveMessage', messageHandler);
    socket.on('roomUpdated', roomUpdatedHandler);
    socket.on('roomDeleted', roomDeletedHandler);
    socket.on('activeUsers', activeUsersHandler);
    
    // Cleanup listener on re-render
    return () => {
      socket.off('receiveMessage', messageHandler);
      socket.off('roomUpdated', roomUpdatedHandler);
      socket.off('roomDeleted', roomDeletedHandler);
      socket.off('activeUsers', activeUsersHandler);
    };
  }, [socket, selectedRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Join room logic
  const handleJoinRoom = async (room: Room) => {
    if (!socket || !authUser) return;
    
    // Leave previous room
    if (selectedRoom) {
      socket.emit('leaveRoom', { roomId: selectedRoom.id, userId: authUser.id });
    }
    
    setSelectedRoom(room);
    setActiveUsers([]);
    
    // Fetch history
    try {
      const history = await api.getMessages(room.id);
      setMessages(history);
      
      // Emit join event
      socket.emit('joinRoom', { roomId: room.id, userId: authUser.id });
    } catch (err) {
      console.error('Failed to join room', err);
    }
  };

  // 4. Send message logic
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !selectedRoom || !messageInput.trim() || !authUser) return;

    const payload = {
      roomId: selectedRoom.id,
      content: messageInput,
    };

    // The server will broadcast this back to us (and others) via 'receiveMessage'
    // Alternatively, we can append it immediately for optimism, but wait for echo is safer for ID syncing
    socket.emit('sendMessage', payload);
    setMessageInput('');
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const newRoom = await api.createRoom({ name: newRoomName });
      setRooms([...rooms, newRoom]);
      setNewRoomName('');
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!socket) return;
    if (confirm('Are you sure you want to delete this room? All messages will be lost.')) {
      socket.emit('deleteRoom', { roomId });
    }
  };

  const handleEditRoom = (roomId: string, currentName: string) => {
    setEditingRoomId(roomId);
    setEditingRoomName(currentName);
  };

  const handleSaveRoomEdit = () => {
    if (!socket || !editingRoomId || !editingRoomName.trim()) return;
    
    socket.emit('updateRoom', { 
      roomId: editingRoomId, 
      updates: { name: editingRoomName } 
    });
    setEditingRoomId(null);
    setEditingRoomName('');
  };

  const handleCancelRoomEdit = () => {
    setEditingRoomId(null);
    setEditingRoomName('');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const payload = {
      username: authUsername.trim(),
      password: authPassword,
    };

    if (!payload.username || !payload.password) {
      setAuthError('Username and password are required.');
      return;
    }

    try {
      const user = isRegistering
        ? await api.register(payload)
        : await api.login(payload);

      setAuthUser(user);
      setAuthPassword('');
      setAuthError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Authentication failed.';
      setAuthError(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    setSelectedRoom(null);
    setMessages([]);
    setActiveUsers([]);
  };

  return (
    <div className="chat-container">
      {/* Connection Status Banner */}
      {connectionStatus !== 'connected' && (
        <div className={`connection-banner ${connectionStatus}`}>
          {connectionStatus === 'disconnected' && '🔴 Disconnected from server'}
          {connectionStatus === 'reconnecting' && '🟡 Reconnecting...'}
        </div>
      )}
      
      <div className="chat-content">
        {!authUser ? (
          <div className="auth-panel">
            <h2>{isRegistering ? 'Create Account' : 'Sign In'}</h2>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <input
                type="text"
                placeholder="Username"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
              {authError && <div className="auth-error">{authError}</div>}
              <button type="submit" className="btn-primary">
                {isRegistering ? 'Register' : 'Login'}
              </button>
            </form>
            <button
              className="btn-link"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError(null);
              }}
            >
              {isRegistering ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </button>
          </div>
        ) : (
          <>
            {/* Sidebar */}
            <div className="sidebar">
              <div className="sidebar-header">
                <h3>💬 Chat Rooms</h3>
                <div className="user-info">
                  Logged in as: <strong>{authUser.username}</strong>
                  <span className={`status-dot ${connectionStatus}`} title={connectionStatus}></span>
                </div>
                <button className="btn-link" onClick={handleLogout}>Log out</button>
              </div>

              <ul className="rooms-list">
                {rooms.map((room) => (
                  <li 
                    key={room.id} 
                    className={`room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                  >
                    {editingRoomId === room.id ? (
                      <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="text"
                          value={editingRoomName}
                          onChange={(e) => setEditingRoomName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveRoomEdit()}
                          style={{ 
                            flex: 1, 
                            padding: '0.5rem', 
                            borderRadius: '6px', 
                            border: '1.5px solid #3b82f6',
                            fontSize: '0.875rem'
                          }}
                          autoFocus
                        />
                        <button 
                          onClick={handleSaveRoomEdit}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                          title="Save"
                        >
                          💾
                        </button>
                        <button 
                          onClick={handleCancelRoomEdit}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                          title="Cancel"
                        >
                          ✖️
                        </button>
                      </div>
                    ) : (
                      <>
                        <div onClick={() => handleJoinRoom(room)} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                          <span className="room-icon">#</span>
                          <span>{room.name}</span>
                        </div>
                        <button 
                          className="btn-edit-room"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRoom(room.id, room.name);
                          }}
                          title="Edit room"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-delete-room"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoom(room.id);
                          }}
                          title="Delete room"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              
              <div className="create-room-section">
                <h4>Create New Room</h4>
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="Room name..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                  />
                  <button className="btn-create" onClick={handleCreateRoom}>+</button>
                </div>
              </div>
            </div>

            {/* Main Chat */}
            <div className="chat-main">
              {selectedRoom ? (
                <>
                  <div className="chat-header">
                    <div>
                      <h3># {selectedRoom.name}</h3>
                    </div>
                    <div className="active-users">
                      <span style={{ fontSize: '0.875rem', color: '#99aab5', marginRight: '0.5rem' }}>👥 Online:</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{activeUsers.length}</span>
                      {activeUsers.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#99aab5', marginTop: '0.25rem' }}>
                          {activeUsers.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="messages-container">
                    {messages.length === 0 ? (
                      <div className="no-messages">No messages yet. Start the conversation! 👋</div>
                    ) : (
                      messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`message ${msg.sender === authUser.username ? 'own-message' : ''}`}
                        >
                          <div className="message-sender">
                            <span>{msg.sender}</span>
                            <span className="message-timestamp">
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="message-content">{msg.content}</div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="message-input-container">
                    <form onSubmit={handleSendMessage} className="message-form">
                      <input 
                        className="message-input"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={`Message #${selectedRoom.name}`}
                        autoFocus
                      />
                      <button 
                        type="submit" 
                        className="btn-send"
                        disabled={!messageInput.trim()}
                      >
                        Send 🚀
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <h3>Welcome to the Chat!</h3>
                  <p>Select a room from the sidebar to start chatting</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
