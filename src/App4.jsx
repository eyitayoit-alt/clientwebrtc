// eslint-disable-next-line no-unused-vars

import {io} from 'socket.io-client'
import {useRef,useEffect} from "react"
import { FiVideo,FiVideoOff,FiMic,FiMicOff} from 'react-icons/fi'
import './style.css'
const configuration = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  }
  const socket=io('http://localhost:3000',{ transports : ['websocket'] })
  
  let pc;
  let localStream;
  let startButton; 
  let hangupButton; 
  let muteAudButton; 
  let muteVidButton;
  let remoteVideo;
  let localVideo;
  socket.on('message', e => {
    if (!localStream) {
      console.log('not ready yet');
      return;
    }
    switch (e.type) {
      case 'offer':
        handleOffer(e);
        break;
      case 'answer':
        handleAnswer(e);
        break;
      case 'candidate':
        handleCandidate(e);
        break;
      case 'ready':
        // A second tab joined. This tab will initiate a call unless in a call already.
        if (pc) {
          console.log('already in call, ignoring');
          return;
        }
        makeCall();
        break;
      case 'bye':
        if (pc) {
          hangup();
        }
        break;
      default:
        console.log('unhandled', e);
        break;
    }})
    function createPeerConnection() {
        try{
      pc = new RTCPeerConnection(configuration);
      pc.onicecandidate = e => {
        const message = {
          type: 'candidate',
          candidate: null,
        };
        if (e.candidate) {
          message.candidate = e.candidate.candidate;
          message.sdpMid = e.candidate.sdpMid;
          message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        socket.emit('message',message);
      };
      pc.ontrack = e => remoteVideo.current.srcObject = e.streams[0];
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }
    catch(e){
        console.log(e)
    }
    }
    
    async function makeCall() {
    try{
      await createPeerConnection();
    
      const offer = await pc.createOffer();
      socket.emit('message',{type: 'offer', sdp: offer.sdp});
      await pc.setLocalDescription(offer);
    }
    catch(e){
        console.log(e)
    }
    }
    
    async function handleOffer(offer) {
      if (pc) {
        console.error('existing peerconnection');
        return;
      }
      try{
      await createPeerConnection();
      await pc.setRemoteDescription(offer);
    
      const answer = await pc.createAnswer();
      socket.emit('message',{type: 'answer', sdp: answer.sdp});
      await pc.setLocalDescription(answer);
      }
      catch(e){
        console.log(e)
      }
    }
    
    async function handleAnswer(answer) {
      if (!pc) {
        console.error('no peerconnection');
        return;
      }
      try{
      await pc.setRemoteDescription(answer);
      }
      catch(e){
        console.log(e)
      }
    }
    
    async function handleCandidate(candidate) {
        try{
      if (!pc) {
        console.error('no peerconnection');
        return;
      }
      if (!candidate) {
        await pc.addIceCandidate(null);
      } else {
        await pc.addIceCandidate(candidate);
      }
    }
    catch(e){
        console.log(e)
    }
    } 
    async function hangup() {
        if (pc) {
          pc.close();
          pc = null;
        }
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        startButton.current.disabled = false;
        hangupButton.current.disabled = true;
        muteAudButton.current.disabled = true;
        muteVidButton.current.disabled = true;
      }
      
      
    
function App() {
    startButton =useRef(null)
    hangupButton =useRef(null)
    muteAudButton =useRef(null)
    muteVidButton =useRef(null)
    localVideo =useRef(null) 
    remoteVideo = useRef(null)
    useEffect(()=>{
        hangupButton.current.disabled=true
        muteAudButton.current.disabled=true
        muteVidButton.current.disabled=true
    },[])
    
    
    
    
   
    const startB = async () => {
        try{
        localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:{'echoCancellation':true}})
        localVideo.current.srcObject = localStream;
        }
        catch(err){
          console.log(err)
        }
    
    
      startButton.current.disabled = true;
      hangupButton.current.disabled = false;
      muteAudButton.current.disabled=false
      muteVidButton.current.disabled=false
    
      socket.emit('message',{type: 'ready'});
    };
    
     const hangB =async () => {
      hangup();
      socket.emit('message',{type: 'bye'});
    };
    

   
  function muteAudio(){
   
  }
function muteVideo(){

}
    
  
 
  return(
    <>
   <main className='container  '>
    
    
    <div className='video bg-main'>
    <video ref={localVideo} className='video-item' autoPlay playsInline src=" "></video>
    <video ref={remoteVideo} className='video-item' autoPlay playsInline src=" "></video>
    </div>
  

    <div className='btn'>
    <button className='btn-item btn-start' ref={startButton} onClick={startB} > <FiVideo /></button>
    <button className='btn-item btn-end' ref={hangupButton} onClick={hangB}> <FiVideoOff /></button>
    <button className='btn-item btn-start' ref={muteAudButton} onClick={muteAudio}> <FiMic /></button>
     <button className='btn-item btn-end' ref={muteVidButton} onClick={muteVideo}> <FiMicOff /> </button>
    </div>
    </main>
      </>
  )
  
}

export default App
