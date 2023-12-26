import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

//---------------------------------------------------------------------------------------------------------------------
//                                                   HTTP SERVER
//---------------------------------------------------------------------------------------------------------------------
const app = express();

// Add support for ejs views.
app.set("view engine", "ejs");

// Serve the static files in the public folder.
app.use(express.static("public"));

// Define the routes here...

//---------------------------------------------------------------------------------------------------------------------
//                                             WEB-SOCKET RElAY SERVER
//---------------------------------------------------------------------------------------------------------------------
const server = createServer(app);
const ws = new Server(server);

ws.on("connection", (socket: any) => {
  // Web socket server code here...
});

// Start the server.
server.listen(3000, () => console.log(`Server listening on port 3000`));