const { log } = require('console');
const express=require('express'); 
const http=require('http');
const{Server}=require('socket.io');

const app=express();
const server=http.createServer(app);
const io=new Server(server);

const PORT=process.env.PORT || 3000;
app.use(express.static('public'));

// SOCKET.IO connection handling 
io.on('connection',(socket)=>{
    console.log("A user Connected !");
    // Listen for a custom event name 'echo' from the client
    socket.on('echo',(message)=>{
        console.log("Received from Client"+message);
        // Emit the same message back to the Client who emit it
        socket.emit('echo',`Server echoed ${message}`);
    });
    // Listen for Client disconnection
    socket.on('disconnect',()=>{
        console.log("User disconnected");
    });
    
});
// Start the Server 
server.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
});

