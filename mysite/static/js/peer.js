// map peer usernames to corresponding RTCPeerConnections
// as key value pairs
var mapPeers = {};

var loc = window.location;

var endPoint = '';
var wsStart = 'ws://';

if(loc.protocol == 'https:'){
    wsStart = 'wss://';
}

var endPoint = wsStart + loc.host + loc.pathname;

var webSocket;

var usernameInput = document.querySelector('#username');
var username;

var btnJoin = document.querySelector('#btn-join');

// set username
// join room (initiate websocket connection)
// upon button click
btnJoin.onclick = () => {
    username = usernameInput.value;
    usernameInput.value = '';
    usernameInput.style.visibility = 'hidden';
    btnJoin.style.visibility = 'hidden';

    document.querySelector('#label-username').innerHTML = username;

    webSocket = new WebSocket(endPoint);

    webSocket.onopen = function(e){
        console.log('Connection opened! ', e);

        // notify other peers
        sendSignal('new-peer', username);
    }
    
    webSocket.onmessage = webSocketOnMessage;
    
    webSocket.onclose = function(e){
        console.log('Connection closed! ', e);
    }
    
    webSocket.onerror = function(e){
        console.log('Error occured! ', e);
    }
}

function webSocketOnMessage(event){
    var parsedData = JSON.parse(event.data);

    var action = parsedData['action'];
    // username of other peer
    var peerUsername = parsedData['peer'];
    
    console.log('peerUsername: ', peerUsername);
    console.log('action: ', action);

    if(peerUsername == username){
        // ignore all messages from oneself
        return;
    }
    
    if(!(peerUsername in mapPeers)){
        // in case of new peer
        // which was not previously added
        if(action == 'new-peer'){
            // create new RTCPeerConnection
            var peer = createOfferer(peerUsername);
            peer.onicecandidate = (event) => {
                if(event.candidate){
                    console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));

                    return;
                }
                
                // event.candidate == null indicates that gathering is complete
                
                console.log('Gathering finished! Sending offer SDP.');
    
                // send offer to new peer
                // after ice candidate gathering is complete
                sendSignal('new-offer', {
                    'sdp': peer.localDescription,
                    'receiver_channel_name': parsedData['sender'],
                });
            }
            
            return;
        }

        if(action == 'new-offer'){
            console.log('Got new offer.');

            // create new RTCPeerConnection
            // set offer as remote description
            var offer = parsedData['message']['sdp'];
            console.log('Offer: ', offer);
            var peer = createAnswerer(offer, peerUsername);

            peer.onicecandidate = (event) => {
                if(event.candidate){
                    console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));

                    return;
                }
                
                // event.candidate == null indicates that gathering is complete

                console.log('Gathering finished! Sending answer SDP.');
        
                // send answer to offering peer
                // after ice candidate gathering is complete
                sendSignal('new-answer', {
                    'sdp': peer.localDescription,
                    'receiver_channel_name': parsedData['sender'],
                });
            }

            return;
        }
    }

    if(action == 'new-answer'){
        // in case of answer to previous offer
        // get the corresponding RTCPeerConnection
        var peer = mapPeers[peerUsername][0];

        if(peer.remoteDescription){
            // ignore in case there is a remote SDP
            // for this RTCPeerConnection
            // as earlier, SDP were programmed
            // to be sent only after gathering is complete

            return;
        }

        // get the answer
        var answer = parsedData['message']['sdp'];
        
        console.log('mapPeers:');
        for(key in mapPeers){
            console.log(key, ': ', mapPeers[key]);
        }

        console.log('peer: ', peer);
        console.log('answer: ', answer);

        // set remote description of the RTCPeerConnection
        peer.setRemoteDescription(answer);

        return;
    }
}

var btnSendMsg = document.querySelector('#btn-send-msg');
btnSendMsg.onclick = btnSendMsgOnClick;

function btnSendMsgOnClick(){
    var messageInput = document.querySelector('#msg');
    var message = messageInput.value;
    
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("Me: " + message));
    ul.appendChild(li);
    
    var dataChannels = getDataChannels();

    console.log('Sending: ', message);

    // send to all data channels
    for(index in dataChannels){
        dataChannels[index].send(username + ': ' + message);
    }
    
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

// true if screen is being shared
// false otherwise
var screenShared = false;

const localVideo = document.querySelector('#local-video');

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
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

// send the given action and message
// over the websocket connection
function sendSignal(action, message){
    webSocket.send(
        JSON.stringify(
            {
                'peer': username,
                'action': action,
                'message': message,
            }
        )
    )
}

// create RTCPeerConnection as offerer
// and store it and its datachannel
function createOfferer(peerUsername){
    var peer = new RTCPeerConnection(null);
        
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

    localDisplayStream.getTracks().forEach(track => {
        peer.addTrack(track, localDisplayStream);
    });

    var dc = peer.createDataChannel("channel");
    dc.onmessage = dcOnMessage;
    dc.onopen = () => {
        console.log("Connection opened.");
    }

    var remoteVideo = createVideo(peerUsername);

    setOnTrack(peer, remoteVideo);

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(function(event){
            console.log("Local Description Set successfully.");
        });
    
    // store the RTCPeerConnection
    // and the corresponding RTCDataChannel
    mapPeers[peerUsername] = [peer, dc];

    console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);

    return peer;
}

// create RTCPeerConnection as answerer
// and store it and its datachannel
function createAnswerer(offer, peerUsername){
    peer = new RTCPeerConnection(null);
        
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

    var remoteVideo = createVideo(peerUsername);

    setOnTrack(peer, remoteVideo);

    peer.ondatachannel = e => {
        peer.dc = e.channel;
        peer.dc.onmessage = dcOnMessage;
        peer.dc.onopen = () => {
            console.log("Connection opened.");
        }

        // store the RTCPeerConnection
        // and the corresponding RTCDataChannel
        // store it after the RTCDataChannel is ready
        // otherwise, peer.dc may be undefined
        // as peer.ondatachannel would not be called yet
        mapPeers[peerUsername] = [peer, peer.dc];
    }

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Offer set.');

            peer.createAnswer()
                .then(a => peer.setLocalDescription(a))
                .then(() => {
                    console.log('Answer created.');
                });
        });

    return peer
}

function dcOnMessage(event){
    var message = event.data;
    
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(message));
    ul.appendChild(li);
}

// get all stored data channels
function getDataChannels(){
    var dataChannels = [];
    
    for(peerUsername in mapPeers){
        console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);
        var dataChannel = mapPeers[peerUsername][1];
        console.log('dataChannel: ', dataChannel);

        dataChannels.push(dataChannel);
    }

    return dataChannels;
}

// for every new peer
// create a new video element
// and its corresponding user gesture button
// assign ids corresponding to the username of the remote peer
function createVideo(peerUsername){
    var videoContainer = document.querySelector('#video-container');

    // create the new video element
    // and corresponding user gesture button
    var remoteVideo = document.createElement('video');
    var btnPlayRemoteVideo = document.createElement('button');

    remoteVideo.id = peerUsername + '-video';
    btnPlayRemoteVideo.id = peerUsername + '-btn-play-remote-video';
    btnPlayRemoteVideo.innerHTML = 'If remote video does not play, click here';

    // wrapper for the video and button elements
    var videoWrapper = document.createElement('div');

    // add the wrapper to the video container
    videoContainer.appendChild(videoWrapper);

    // add the video and button to the wrapper
    videoWrapper.appendChild(remoteVideo);
    videoWrapper.appendChild(btnPlayRemoteVideo);

    // as user gesture
    // video is played by button press
    // otherwise, some browsers might block video
    btnPlayRemoteVideo.addEventListener("click", function (){
        remoteVideo.play();
        btnPlayRemoteVideo.style.visibility = 'hidden';
    });

    return remoteVideo;
}

// set onTrack for RTCPeerConnection
// to add remote tracks to remote stream
// to show video through corresponding remote video element
function setOnTrack(peer, remoteVideo){
    // create new MediaStream for remote tracks
    var remoteStream = new MediaStream();

    // assign remoteStream as the source for remoteVideo
    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track', async (event) => {
        console.log('Adding track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });
}