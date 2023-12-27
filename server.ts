import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

//---------------------------------------------------------------------------------------------------------------------
//                                                   HTTP SERVER
//---------------------------------------------------------------------------------------------------------------------
const app = express();

// Add support for ejs views.
app.set("view engine", "ejs");

// Serve the static files in the public folder.
app.use(express.static("public"));

// When accessing the root path, redirect the user to a new room.
app.get("/", (_, res) => res.redirect(`/room/${uuidv4()}`));

// When accessing a room, render the room.ejs file.
app.get("/room/:roomId", (req, res) => res.render("room", { roomId: req.params.roomId }));

//---------------------------------------------------------------------------------------------------------------------
//                                             WEB-SOCKET RElAY SERVER
//---------------------------------------------------------------------------------------------------------------------
const server = createServer(app);
const ws = new Server(server);

ws.on("connection", (socket: any) => {
  socket.on("JoinRoom", (roomId: string) => {
    // Notify everyone in the room.
    socket.to(roomId).emit("UserJoined", socket.id);

    // Add the user to the room.
    socket.join(roomId);

    socket.on("disconnect", () => {
      // Notify everyone in the room that the user has left.
      socket.to(roomId).emit("UserLeft", socket.id);
    });
  });

  socket.on("Signal", (peerId: string, message: any) => {
    // Relay the message to the other peer.
    socket.to(peerId).emit("Signal", socket.id, message);
  });
});

// Start the server.
server.listen(3000, () => console.log(`Server listening on port 3000`));