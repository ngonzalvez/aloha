//----------------------------------------------------------------------------------------------------------------------
//                                            GLOBAL VARIABLES
//---------------------------------------------------------------------------------------------------------------------
const { roomId } = window.aloha;
const socket = io(window.location.host);
let localStream = null;

//----------------------------------------------------------------------------------------------------------------------
//                                                  GENERAL
//---------------------------------------------------------------------------------------------------------------------
async function init() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: true,
  });

  addParticipantStream(localStream, "me");
  setActiveParticipantStream(localStream);
  socket.emit("JoinRoom", roomId);
}

window.onload = init;

//----------------------------------------------------------------------------------------------------------------------
//                                                UI UTILITIES
//----------------------------------------------------------------------------------------------------------------------
function addParticipantStream(stream, peerId) {
  // Create the video preview.
  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;
  video.onclick = () => setActiveParticipantStream(stream);
  video.setAttribute("data-peer-id", peerId);

  // Append it to the participants container.
  const container = document.getElementById("participants");
  container.appendChild(video);
}

function setActiveParticipantStream(stream) {
  const currentVideo = document.getElementById("active-participant");
  currentVideo.srcObject = stream;
}

//----------------------------------------------------------------------------------------------------------------------
//                                             P2P CONNECTION LOGIC
//----------------------------------------------------------------------------------------------------------------------
const peers = {};

socket.on("UserJoined", (peerId) => createPeerConnection(peerId, "offer"));
socket.on("Signal", (peerId, message) => {
  if (message.offer) createPeerConnection(peerId, "answer", message.offer);
  if (message.answer) peers[peerId].setRemoteDescription(message.answer);
  if (message.candidate) peers[peerId].addIceCandidate(message.candidate);
});

socket.on("UserLeft", (peerId) => {
  // Close the connection.
  peers[peerId].close();
  delete peers[peerId];

  // Remove the video stream from the UI.
  document.querySelector(`[data-peer-id="${peerId}"]`).remove();
});

async function createPeerConnection(peerId, type, remoteOffer) {
  const conn = (peers[peerId] = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  }));

  conn.onicecandidate = ({ candidate }) => {
    // Send it to the other peer.
    if (candidate) socket.emit("Signal", peerId, { candidate });
  };

  // Add a video stream to the UI for this peer.
  const peerStream = new MediaStream();
  addParticipantStream(peerStream, peerId);

  // When a new track is added to the connection, get it and attach it to the peer stream.
  conn.ontrack = (event) => {
    const [stream] = event.streams;
    stream.getTracks().forEach((track) => {
      peerStream.addTrack(track);
    });
  };

  // Attach the media tracks from the camera stream
  // to the connection.
  localStream.getTracks().forEach((track) => {
    conn.addTrack(track, localStream);
  });

  // If there is an offer from the remote peer, set it in the connection.
  if (remoteOffer) conn.setRemoteDescription(remoteOffer);

  // Create the offer/answer.
  const localDescription = type === "offer" ? await conn.createOffer() : await conn.createAnswer();

  // Set the local offer/answer in the connection.
  conn.setLocalDescription(localDescription);

  // Send it to the other peer.
  socket.emit("Signal", peerId, { [type]: localDescription });
}