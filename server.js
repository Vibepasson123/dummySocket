const WebSocket = require('ws');

// WebSocket server setup
const server = new WebSocket.Server({ port: 3000 });

// In-memory storage for registered users
const users = {};

server.on('connection', (ws) => {
    console.log('Client connected');

    // Listen for messages from clients
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'register':
                    handleRegister(ws, data.userId);
                    break;
                case 'call-user':
                    handleCallUser(data);
                    break;
                case 'answer-call':
                    handleAnswerCall(data);
                    break;
                case 'ice-candidate':
                    handleIceCandidate(data);
                    break;
                default:
                    console.log(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error(`Error parsing message: ${error.message}`);
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        handleDisconnect(ws);
        console.log('Client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`Error: ${error.message}`);
    });
});

console.log('WebSocket server running on ws://localhost:3000');

// Handle user registration
function handleRegister(ws, userId) {
    if (!userId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid userId' }));
        return;
    }

    users[userId] = ws; // Store the WebSocket connection for the user
    ws.userId = userId; // Attach the userId to the WebSocket
    console.log(`User registered: ${userId}`);
    ws.send(JSON.stringify({ type: 'registered', userId }));
}

// Handle initiating a call
function handleCallUser(data) {
    const { from, to, offer } = data;

    if (!users[to]) {
        console.log(`User ${to} not found`);
        if (users[from]) {
            users[from].send(JSON.stringify({ type: 'user-not-found', to }));
        }
        return;
    }

    console.log(`Call from ${from} to ${to}`);
    users[to].send(JSON.stringify({ type: 'incoming-call', from, offer }));
}

// Handle answering a call
function handleAnswerCall(data) {
    const { to, answer } = data;

    if (!users[to]) {
        console.log(`User ${to} not found`);
        return;
    }

    console.log(`Answer sent to ${to}`);
    users[to].send(JSON.stringify({ type: 'call-answered', answer }));
}

// Handle ICE candidate exchange
function handleIceCandidate(data) {
    const { to, candidate } = data;

    if (!users[to]) {
        console.log(`User ${to} not found`);
        return;
    }

    console.log(`ICE candidate sent to ${to}`);
    users[to].send(JSON.stringify({ type: 'ice-candidate', candidate }));
}

// Handle user disconnect
function handleDisconnect(ws) {
    if (ws.userId && users[ws.userId]) {
        delete users[ws.userId]; // Remove user from memory
        console.log(`User unregistered: ${ws.userId}`);
    }
}
