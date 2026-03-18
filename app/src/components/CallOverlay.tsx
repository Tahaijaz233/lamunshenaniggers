import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff
} from 'lucide-react';
import { socketService } from '@/services/socket';
import { toast } from 'sonner';
import type { User } from '@/types';

interface CallOverlayProps {
  call: {
    isActive: boolean;
    type: 'voice' | 'video';
    peer?: User;
    isIncoming?: boolean;
    callId?: string;
    offer?: RTCSessionDescriptionInit;
  };
  onClose: () => void;
  currentUser: User | null;
}

const CallOverlay: React.FC<CallOverlayProps> = ({
  call,
  onClose,
  currentUser: _currentUser
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.type === 'video'
      });
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
        
        // Start call duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && call.peer) {
          socketService.sendIceCandidate({
            callId: call.callId!,
            candidate: event.candidate,
            to: call.peer.id
          });
        }
      };

      // Handle incoming ICE candidates
      socketService.on('ice_candidate', (data: any) => {
        if (data.callId === call.callId) {
          pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      // Handle call acceptance
      socketService.on('call_accepted', async (data: any) => {
        if (data.callId === call.callId) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      // Handle call rejection
      socketService.on('call_rejected', (data: any) => {
        if (data.callId === call.callId) {
          toast.error('Call was rejected');
          endCall();
        }
      });

      // Handle call end
      socketService.on('call_ended', (data: any) => {
        if (data.callId === call.callId) {
          endCall();
        }
      });

      // If outgoing call, create offer
      if (!call.isIncoming && call.peer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socketService.callUser({
          recipientId: call.peer.id,
          type: call.type,
          offer
        });
      }

      // If incoming call, create answer
      if (call.isIncoming && call.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socketService.respondToCall({
          callId: call.callId!,
          accepted: true,
          answer
        });
      }
    } catch (error) {
      console.error('Call initialization error:', error);
      toast.error('Could not start call');
      onClose();
    }
  };

  const cleanup = () => {
    // Stop all tracks
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    
    // Close peer connection
    peerConnectionRef.current?.close();
    
    // Clear interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const acceptCall = async () => {
    // Handled in initializeCall for incoming calls
  };

  const rejectCall = () => {
    if (call.callId) {
      socketService.respondToCall({
        callId: call.callId,
        accepted: false
      });
    }
    endCall();
  };

  const endCall = () => {
    if (call.callId) {
      socketService.endCall({
        callId: call.callId,
        duration: callDuration
      });
    }
    cleanup();
    onClose();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (call.isIncoming && !isConnected) {
    return (
      <div className="call-overlay">
        <div className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-6">
            <AvatarImage src={call.peer?.avatar || undefined} />
            <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37] text-3xl">
              {getInitials(call.peer?.displayName || call.peer?.username || 'U')}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {call.peer?.displayName || call.peer?.username}
          </h2>
          <p className="text-gray-400 mb-8">
            Incoming {call.type} call...
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            <Button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
            >
              <Phone className="w-8 h-8" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="call-overlay">
      {/* Remote Video (full screen) */}
      {call.type === 'video' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">
            {call.peer?.displayName || call.peer?.username}
          </h2>
          <p className="text-gray-300">
            {isConnected ? formatDuration(callDuration) : 'Connecting...'}
          </p>
        </div>

        {/* Local Video (picture in picture) */}
        {call.type === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-lg overflow-hidden border-2 border-[#d4af37]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Avatar for voice calls */}
        {call.type === 'voice' && (
          <Avatar className="w-32 h-32">
            <AvatarImage src={call.peer?.avatar || undefined} />
            <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37] text-4xl">
              {getInitials(call.peer?.displayName || call.peer?.username || 'U')}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleMute}
            variant="ghost"
            className={`w-14 h-14 rounded-full ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-[#1a1a1a] text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {call.type === 'video' && (
            <Button
              onClick={toggleVideo}
              variant="ghost"
              className={`w-14 h-14 rounded-full ${
                isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-[#1a1a1a] text-white'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>
          )}

          <Button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
