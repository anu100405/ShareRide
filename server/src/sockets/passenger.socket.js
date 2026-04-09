const { SOCKET_EVENTS } = require('../config/constants');
const { getSocketByUserId, getIO } = require('./socket.store');
const rideService = require('../services/ride.service');

const registerPassengerHandlers = (io, socket, user) => {
  // Passenger requests a new ride
  // Payload: { pickup, dropoff, vehicleType, rideType }
  // pickup/dropoff: { address, coordinates: { lat, lng } }
  socket.on(SOCKET_EVENTS.PASSENGER_REQUEST_RIDE, async (payload) => {
    try {
      const { pickup, dropoff, vehicleType, rideType } = payload;

      const ride = await rideService.createRide({
        passengerId: user._id,
        pickup,
        dropoff,
        vehicleType,
        rideType,
      });

      socket.emit('ride:requested', {
        rideId: ride._id,
        status: ride.status,
        fare: ride.fare,
        distance: ride.distance,
        otp: ride.otp,
      });
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  // Passenger cancels a ride
  // Payload: { rideId, reason }
  socket.on(SOCKET_EVENTS.PASSENGER_CANCEL_RIDE, async ({ rideId, reason }) => {
    try {
      const ride = await rideService.cancelRide(rideId, 'passenger', reason);

      socket.emit(SOCKET_EVENTS.RIDE_CANCELLED, { rideId });

      // Notify driver if assigned
      if (ride.driver) {
        const driverSocket = getSocketByUserId(ride.driver.toString());
        if (driverSocket) {
          io.to(driverSocket).emit(SOCKET_EVENTS.RIDE_CANCELLED, {
            rideId,
            reason: 'Passenger cancelled the ride',
          });
        }
      }
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });
};

module.exports = registerPassengerHandlers;