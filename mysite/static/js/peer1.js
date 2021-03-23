var loc = window.location;

var endPoint = '';
var wsStart = 'ws://';

console.log('protocol: ', loc.protocol);
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

    peer1.close();
}

webSocket.onerror = function(e){
    console.log('Error occured! ', e);
}

var btnSendOffer = document.querySelector('#btn-send-offer');

btnSendOffer.onclick = btnSendOfferOnClick;

function webSocketOnMessage(event){
    var parsed_data = JSON.parse(event.data);
    
    var action = parsed_data['action'];

    if(parsed_data['peer'] == 'peer1'){
        // ignore all messages from oneself
        return;
    }else if(action == 'peer2-candidate'){
        // probably unreachable
        // since peer2 will not send new ice candidates
        // but send answer after gathering is complete
        
        // console.log('Adding new ice candidate.')
        peer1.addIceCandidate(parsed_data['message']);
        return;
    }

    const thisPeer = parsed_data['peer'];
    const answer = parsed_data['message'];
    console.log('thisPeer: ', thisPeer);
    console.log('Answer received: ', answer);

    peer1.setRemoteDescription(answer);
}

// as user gesture
// video is played by button press
// otherwise, some browsers might block video
btnPlayRemoteVideo = document.querySelector('#btn-play-remote-video');
btnPlayRemoteVideo.addEventListener("click", function (){
    remoteVideo.play();
    btnPlayRemoteVideo.style.visibility = 'hidden';
});

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

function btnSendOfferOnClick(event){
    sendSignal('peer1', 'send-offer', peer1.localDescription);

    btnSendOffer.style.visibility = 'hidden';
}

var btnSendMsg = document.querySelector('#btn-send-msg');
btnSendMsg.onclick = btnSendMsgOnClick;

function btnSendMsgOnClick(){
    var messageInput = document.querySelector('#msg');
    var message = messageInput.value;
    
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Me: " + message));
    ul.appendChild(li);
    
    console.log('Sending: ', message);

    // send to all data channels
    // in multi peer environment
    dc.send(message);
    
    messageInput.value = '';
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
var peer1;
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

// ul of messages
var ul = document.querySelector("#message-list");

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
    .then(e => {
        btnShareScreen.onclick = event => {
            if(screenShared){
                // toggle screenShared
                screenShared = !screenShared;

                // set to own video
                // if screen already shared
                localVideo.srcObject = localStream;
                btnShareScreen.innerHTML = 'Share screen';

                return;
            }
            
            // toggle screenShared
            screenShared = !screenShared;

            navigator.mediaDevices.getDisplayMedia(constraints)
                .then(stream => {
                    localDisplayStream = stream;

                    // set to display stream
                    // if screen not shared
                    localVideo.srcObject = localDisplayStream;
                });

            btnShareScreen.innerHTML = 'Stop sharing';
        }
    })
    .then(e => {
        // perform all offerer activities
        createOfferer();
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

function createOfferer(){
    peer1 = new RTCPeerConnection(null);
        
    localStream.getTracks().forEach(track => {
        peer1.addTrack(track, localStream);
    });

    localDisplayStream.getTracks().forEach(track => {
        peer1.addTrack(track, localDisplayStream);
    });

    dc = peer1.createDataChannel("channel");
    dc.onmessage = dcOnMessage
    dc.onopen = () => {
        console.log("Connection opened.");

        // make play button visible
        // upon connection
        // to play video in case
        // browser blocks it
        btnPlayRemoteVideo.style.visibility = 'visible';
    }

    peer1.onicecandidate = (event) => {
        if(event.candidate){
            console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer1.localDescription));
        }else{
            console.log('Gathering finished!');

            // send offer in multi peer environment
            // sendSignal('peer1', 'send-offer', peer1.localDescription);
        }
    }

    remoteStream = new MediaStream();
    remoteVideo = document.querySelector('#remote-video');
    remoteVideo.srcObject = remoteStream;

    peer1.addEventListener('track', async (event) => {
        remoteStream.addTrack(event.track, remoteStream);
    });

    peer1.createOffer()
        .then(o => peer1.setLocalDescription(o))
        .then(function(event){
            console.log("Local Description Set successfully.");
        });
    
    function dcOnMessage(event){
        var message = event.data;
        
        var li = document.createElement("li");
        li.appendChild(document.createTextNode("Other: " + message));
        ul.appendChild(li);
    }
}