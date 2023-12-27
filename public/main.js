//----------------------------------------------------------------------------------------------------------------------
//                                                  GENERAL
//----------------------------------------------------------------------------------------------------------------------
async function init() {}

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
const socket = io("http://localhost:3000");
