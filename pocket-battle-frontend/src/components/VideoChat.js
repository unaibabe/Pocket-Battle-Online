import React, { useEffect, useRef, useState, useCallback } from 'react';

// Configuración de servidores STUN. Son necesarios para que los navegadores
// se encuentren a través de Internet (NAT Traversal).
const stunServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Componente que gestiona la videollamada WebRTC.
 * @param {object} props
 * @param {SocketIOClient.Socket} props.socket - La instancia del socket conectado.
 * @param {string} props.roomId - El ID de la sala.
 * @param {boolean} props.isCaller - True si este cliente debe iniciar la llamada.
 */
function VideoChat({ socket, roomId, isCaller }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Usamos refs para guardar la conexión y el stream, ya que no queremos
  // que sus cambios provoquen un re-render.
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isPeerConnected, setIsPeerConnected] = useState(false);

  const createPeerConnection = useCallback(() => {
    try {
      console.log("Creando RTCPeerConnection...");
      const pc = new RTCPeerConnection(stunServers);

      // Cuando se genera un "ICE candidate", lo enviamos al otro peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Enviando ICE candidate...');
          socket.emit('WEBRTC_SIGNAL', {
            roomId,
            payload: { type: 'ice-candidate', candidate: event.candidate },
          });
        }
      };

      // Cuando el otro peer nos envíe su stream, lo mostramos
      pc.ontrack = (event) => {
        console.log('Stream remoto recibido.');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsPeerConnected(true);
        }
      };

      // Añadir los tracks de nuestro stream local a la conexión
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }
      
      peerConnectionRef.current = pc;
      return pc;
    } catch (error) {
      console.error("Fallo al crear la conexión P2P:", error);
      return null;
    }
  }, [socket, roomId]);

  const createPeerConnectionAndOffer = useCallback(() => {
    console.log('Creando oferta SDP...');
    const pc = createPeerConnection();
    if (!pc) {
      console.error("No se pudo crear la conexión P2P para la oferta.");
      return;
    }

    pc?.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        if (pc.localDescription) {
          console.log("Enviando oferta...");
          socket.emit('WEBRTC_SIGNAL', {
            roomId,
            payload: { type: 'offer', sdp: pc.localDescription },
          });
        }
      })
      .catch(error => console.error("Error creando la oferta:", error));
  }, [createPeerConnection, socket, roomId]);

  const handleWebRtcSignal = useCallback(async (payload) => {
    console.log("Señal WebRTC recibida:", payload.type);
    let pc = peerConnectionRef.current;

    // Si no hay conexión y llega una oferta, la creamos.
    // Este es el punto de entrada para el cliente receptor.
    if (!pc && payload.type === 'offer') {
      pc = createPeerConnection();
      if (!pc) {
        console.error("No se pudo crear la conexión P2P al recibir la oferta.");
        return;
      }
    } else if (!pc) {
      // Si no hay conexión y llega otra cosa (answer, ice-candidate), es un error de secuencia.
      // Podríamos encolar los candidatos ICE, pero por simplicidad los ignoramos.
      console.warn('Señal recibida sin una conexión P2P activa, ignorando:', payload.type);
      return;
    }

    try {
      switch (payload.type) {
        case 'offer':
          { console.log('Oferta recibida. Creando respuesta...');
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (pc.localDescription) {
            console.log("Enviando respuesta...");
            socket.emit('WEBRTC_SIGNAL', {
              roomId,
              payload: { type: 'answer', sdp: pc.localDescription },
            });
          }
          break; }

        case 'answer':
          console.log('Respuesta recibida.');
          // Solo establece la descripción remota si no está ya establecida
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          }
          break;

        case 'ice-candidate':
          console.log('ICE candidate recibido.');
          // Añadir el candidato solo si la descripción remota ya está establecida
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            console.warn("Candidato ICE recibido antes de la descripción remota. Se ignora.");
          }
          break;

        default:
          console.warn('Tipo de señal WebRTC desconocida:', payload.type);
      }
    } catch (error) {
      console.error(`Error manejando señal WebRTC (${payload.type}):`, error);
    }
  }, [createPeerConnection, socket, roomId]);

  useEffect(() => {
    const handlePlayerConnected = () => {
      console.log('¡Rival conectado! Creando oferta WebRTC...');
      createPeerConnectionAndOffer();
    };

    // --- 1. Iniciar acceso a cámara y micro ---
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // Guardar y mostrar el stream local
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // --- 2. Lógica de conexión ---
        if (isCaller) {
          socket.on('PLAYER_CONNECTED', handlePlayerConnected);
        }
        socket.on('WEBRTC_SIGNAL', handleWebRtcSignal);
      })
      .catch((error) => {
        console.error('Error al acceder a la cámara/micrófono:', error);
      });

    // --- Función de limpieza al desmontar el componente ---
    return () => {
      console.log("Limpiando componente VideoChat...");
      // Parar tracks de video/audio
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      // Cerrar conexión P2P
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      // Limpiar listeners del socket para evitar fugas de memoria
      socket.off('PLAYER_CONNECTED', handlePlayerConnected);
      socket.off('WEBRTC_SIGNAL', handleWebRtcSignal);
    };
  }, [socket, roomId, isCaller, createPeerConnectionAndOffer, handleWebRtcSignal]);

  return (
    <div className="video-chat-container">
      <div className="video-local">
        <h3>Tu Cámara</h3>
        <video ref={localVideoRef} autoPlay playsInline muted />
      </div>
      <div className="video-remote">
        <h3>Rival</h3>
        <video ref={remoteVideoRef} autoPlay playsInline />
        {!isPeerConnected && <p>Esperando al rival...</p>}
      </div>
    </div>
  );
}

export default VideoChat;