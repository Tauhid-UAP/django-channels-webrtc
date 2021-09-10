var loc = window.location;

var endPoint = '';
var wsStart = 'ws://';

if(loc.protocol == 'https:'){
    wsStart = 'wss://';
}

var endPoint = wsStart + loc.host + loc.pathname;

var webSocket = new WebSocket(endPoint);

webSocket.onopen = function(e){
            console.log('Connection opened! ', e);
}

webSocket.onmessage = webSocketOnMessage;

webSocket.onclose = function(e){
    console.log('Connection closed! ', e);
}

webSocket.onerror = function(e){
    console.log('Error occured! ', e);
}

function webSocketOnMessage(event){
    var parsed_data = JSON.parse(event.data);

    var action = parsed_data['action'];

    if(parsed_data['peer'] == 'peer2'){
        // ignore all messages from oneself
        return;
    }else if(action == 'peer1-candidate'){
        peer2.addIceCandidate(parsed_data['message']);
        return;
    }

    const offer = parsed_data['message'];
    // perform all answerer activities
    createAnswerer();
    peer2.setRemoteDescription(offer)
        .then(function(event){
            console.log('Offer set.');

            peer2.createAnswer()
                .then(a => peer2.setLocalDescription(a))
                .then(function(event){
                    console.log('Answer created.');
                    // sendSignal('peer2', 'send-answer', peer2.localDescription);
                });
        });


}

// send the given action and message strings
// over the websocket connection
function sendSignal(thisPeer, action, message){
    webSocket.send(
        JSON.stringify(
            {
                'peer': thisPeer,
                'action': action,
                'message': message,
            }
        )
    )
}

var btnSendMsg = document.querySelector('#btn-send-msg');
btnSendMsg.onclick = btnSendMsgOnClick;

var ul = document.querySelector("#message-list");

function btnSendMsgOnClick(){
    var messageInput = document.querySelector('#msg');
    var message = messageInput.value;
    
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Me: " + message));
    ul.appendChild(li);
    
    console.log('Sending: ', message);

    peer2.dc.send(message);
    
    messageInput.value = '';
}

function dcOnMessage(event){
    var message = event.data;
    
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Other: " + message));
    ul.appendChild(li);
}

const constraints = {
    'video': true,
    'audio': true
}

const iceConfiguration = {
    iceServers: [
        {
            urls: ['turn:numb.viagenie.ca'],
            credential: '{{numb_turn_credential}}',
            username: '{{numb_turn_username}}'
        }
    ]
};

        
// later assign an RTCPeerConnection
var peer2;
// later assign the datachannel
var dc;

// true if screen is being shared
// false otherwise
var screenShared = false;

const localVideo = document.querySelector('#local-video');
var remoteVideo;

// later assign button
// to play remote video
// in case browser blocks it
var btnPlayRemoteVideo;

// button to start or stop screen sharing
var btnShareScreen = document.querySelector('#btn-share-screen');

// local video stream
var localStream = new MediaStream();
// remote video stream;
var remoteStream;

// local screen stream
// for screen sharing
var localDisplayStream = new MediaStream();

userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        console.log('Got MediaStream:', stream);
        mediaTracks = stream.getTracks();
        
        for(i=0; i < mediaTracks.length; i++){
            console.log(mediaTracks[i]);
        }
        
        localVideo.srcObject = localStream;
        localVideo.muted = true;
        
        window.stream = stream; // make variable available to browser console
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

function createAnswerer(){
    peer2 = new RTCPeerConnection(null);
        
    localStream.getTracks().forEach(track => {
        peer2.addTrack(track, localStream);
    });

    remoteStream = new MediaStream();
    remoteVideo = document.querySelector('#remote-video');
    remoteVideo.srcObject = remoteStream;

    window.stream = remoteStream;

    peer2.addEventListener('track', async (event) => {
        console.log('Adding track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });

    // as user gesture
    // video is played by button press
    // otherwise, some browsers might block video
    btnPlayRemoteVideo = document.querySelector('#btn-play-remote-video');
    btnPlayRemoteVideo.addEventListener("click", function (){
        remoteVideo.play();
        btnPlayRemoteVideo.style.visibility = 'hidden';
    });

    peer2.onicecandidate = (event) => {
        if(event.candidate){
            console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer2.localDescription));

            // following statement not required anymore
            // since answer will be sent after gathering is complete
            // sendSignal('peer2', 'peer2-candidate', event.candidate);
        }else{
            console.log('Gathering finished!');

            // send answer in multi peer environment
            sendSignal('peer2', 'send-answer', peer2.localDescription);
        }
    }

    peer2.ondatachannel = e => {
        peer2.dc = e.channel;
        peer2.dc.onmessage = dcOnMessage;
        peer2.dc.onopen = () => {
            console.log("Connection opened.");
            
            // make play button visible
            // upon connection
            // to play video in case
            // browser blocks it
            btnPlayRemoteVideo.style.visibility = 'visible';
        }
    }
}