const express = require('express');
const http = require('http');
const { Server } = require('socket.io')
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
const usersInRoom = {};
io.on('connection', (socket) => {
    console.log(`User Connected : ${socket.id}`);
    console.log("Total connected users:", io.engine.clientsCount);
    io.emit('updateUserCount', io.engine.clientsCount);
    socket.on('joinRoom', ({ name, room }) => {
        let currentUser = usersInRoom[socket.id];
        if (currentUser && currentUser.room !== room) {
            socket.leave(currentUser.room);
            io.to(currentUser.room).emit('chat', {
                user: "system",
                message: `${currentUser.name} left the Room.`
            });
        }

        socket.join(room);
        usersInRoom[socket.id] = { name, room };
        console.log(`${socket.id} joined the room ${room}`);

        // socket.emit('chat', { user: 'system', message: `You have joined ${room}` });
        io.to(room).emit('chat', { user: 'system', message: `${name} has joined ${room}`, id:null });
    });

    // When clients sends back the data and socket needs to deliver to others
    socket.on('chat', ({ name, message }) => {
        const currentUser = usersInRoom[socket.id];
        if (currentUser) {
            console.log(`Message in ${currentUser.room} from ${name} : ${message}`);
            io.to(currentUser.room).emit('chat', {
                user: 'server',
                message: `<b>${name}</b> - ${message}`,
                id:socket.id
            });
        } else {
            socket.emit('chat', {
                id:null,
                user: 'system',
                message: `${name} did not join any Room.`
            });
        }
    });
    //Leave Room
    socket.on('leaveRoom', ({ name, room }) => {
        socket.leave(room);
        console.log(`${name} left ${room}`);
        socket.to(room).emit('chat', {
            user:'system',
            message:`${name} has left the Room `
        });
        delete usersInRoom[socket.id];
    });

    // Socket Leave 
    socket.on('disconnect', () => {
        const user = usersInRoom[socket.id];
        if (user) {
            io.to(user.room).emit('chat', {
                user: 'system',
                message: `${user.name} left the chat`
            });
            delete usersInRoom[socket.id];
        }
        io.emit('updateUserCount', io.engine.clientsCount);
    });
});
server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});