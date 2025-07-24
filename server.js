// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3001;

app.use(express.static('public'));

// --- Data Structure to track users and their rooms ---
// In a real app, this might be a database or more sophisticated state management
const usersInRooms = {}; // Key: socket.id, Value: roomName
// ----------------------------------------------------

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- Event: 'joinRoom' ---
    // Client sends this to join a specific room
    socket.on('joinRoom', (roomName) => {
        // First, check if the user is already in a room.
        // If they are, make them leave the old room before joining the new one.
        const currentRoom = usersInRooms[socket.id];
        if (currentRoom && currentRoom !== roomName) {
            socket.leave(currentRoom); // Leave the old room
            console.log(`${socket.id} left room: ${currentRoom}`);
            // Optional: Notify old room that user left
            io.to(currentRoom).emit('chatMessage', { user: 'System', message: `${socket.id} left the room.` });
        }

        // Join the new room
        socket.join(roomName);
        usersInRooms[socket.id] = roomName; // Update our tracking
        console.log(`${socket.id} joined room: ${roomName}`);

        // Emit a system message back to the client that joined
        socket.emit('chatMessage', { user: 'System', message: `You have joined ${roomName}` });
        // Emit a system message to everyone *in that room* (including the joining user)
        io.to(roomName).emit('chatMessage', { user: 'System', message: `${socket.id} has joined ${roomName}` });
    });

    // --- Event: 'chatMessage' ---
    // Client sends a message to their current room
    socket.on('chatMessage', (message) => {
        const currentRoom = usersInRooms[socket.id];
        if (currentRoom) {
            console.log(`Message in ${currentRoom} from ${socket.id}: ${message}`);
            // Emit the message to all clients in the current room
            // 'io.to(roomName).emit()' sends to all sockets in that room
            io.to(currentRoom).emit('chatMessage', { user: socket.id, message: message, room: currentRoom });
        } else {
            // If user hasn't joined a room yet, send a private error
            socket.emit('chatMessage', { user: 'System', message: 'Please join a room first!' });
        }
    });

    // --- Event: 'disconnect' ---
    // Handle user disconnection
    socket.on('disconnect', () => {
        const roomLeft = usersInRooms[socket.id];
        if (roomLeft) {
            // Notify the room that the user left
            io.to(roomLeft).emit('chatMessage', { user: 'System', message: `${socket.id} has disconnected.` });
            delete usersInRooms[socket.id]; // Remove from our tracking
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});