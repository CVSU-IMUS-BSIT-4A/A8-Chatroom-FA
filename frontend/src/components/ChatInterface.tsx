import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../api';
import { Message, Room } from '../types/chat';

const SOCKET_URL = 'http://localhost:3000';

export const ChatInterface: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>('Guest-' + Math.floor(Math.random() * 1000));
  const [messageInput, setMessageInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize API and Socket
  useEffect(() => {
    // Fetch initial rooms
    api.getRooms().then(setRooms).catch(console.error);

    // Connect to Socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const messageHandler = (message: Message) => {
      // Only append if it belongs to current room
      if (selectedRoom && message.roomId === selectedRoom.id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('receiveMessage', messageHandler);
    
    // Cleanup listener on re-render
    return () => {
      socket.off('receiveMessage', messageHandler);
    };
  }, [socket, selectedRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Join room logic
  const handleJoinRoom = async (room: Room) => {
    if (!socket) return;
    
    setSelectedRoom(room);
    
    // Fetch history
    try {
      const history = await api.getMessages(room.id);
      setMessages(history);
      
      // Emit join event
      socket.emit('joinRoom', { roomId: room.id, userId: username });
    } catch (err) {
      console.error('Failed to join room', err);
    }
  };

  // 4. Send message logic
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !selectedRoom || !messageInput.trim()) return;

    const payload = {
      roomId: selectedRoom.id,
      sender: username,
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

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>💬 Chat Rooms</h3>
          <div className="user-info">
            Logged in as: <strong>{username}</strong>
          </div>
        </div>
        
        <ul className="rooms-list">
          {rooms.map((room) => (
            <li 
              key={room.id} 
              onClick={() => handleJoinRoom(room)}
              className={`room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
            >
              <span className="room-icon">#</span>
              <span>{room.name}</span>
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
              <h3># {selectedRoom.name}</h3>
              {selectedRoom.description && (
                <p style={{ fontSize: '0.875rem', color: '#99aab5', marginTop: '0.25rem' }}>
                  {selectedRoom.description}
                </p>
              )}
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">No messages yet. Start the conversation! 👋</div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.sender === username ? 'own-message' : ''}`}
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
    </div>
  );
};
