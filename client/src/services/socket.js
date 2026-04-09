import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket) socket.disconnect();
  socket = io('http://localhost:3000', {
    auth: { token: `Bearer ${token}` },
    autoConnect: true,
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Passenger emitters
export const emitRequestRide = (data) => socket?.emit('passenger:request_ride', data);
export const emitCancelRide = (rideId, reason) => socket?.emit('passenger:cancel_ride', { rideId, reason });

// Driver emitters
export const emitGoOnline = () => socket?.emit('driver:go_online');
export const emitGoOffline = () => socket?.emit('driver:go_offline');
export const emitUpdateLocation = (lat, lng) => socket?.emit('driver:update_location', { lat, lng });
export const emitAcceptRide = (rideId) => socket?.emit('driver:accept_ride', { rideId });
export const emitRejectRide = (rideId) => socket?.emit('driver:reject_ride', { rideId });
export const emitStartRide = (rideId, otp) => socket?.emit('driver:start_ride', { rideId, otp });
export const emitCompleteRide = (rideId) => socket?.emit('driver:complete_ride', { rideId });
export const emitDriverCancelRide = (rideId, reason) => socket?.emit('driver:cancel_ride', { rideId, reason });
