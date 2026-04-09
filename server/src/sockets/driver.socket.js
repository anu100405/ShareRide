const Driver = require('../models/driver.model');
const { SOCKET_EVENTS, DRIVER_STATUS } = require('../config/constants');
const { getSocketByUserId, getIO } = require('./socket.store');
const rideService = require('../services/ride.service');

const registerDriverHandlers = (io, socket, user) => {
  // Driver goes online — starts receiving ride requests
  socket.on(SOCKET_EVENTS.DRIVER_GO_ONLINE, async () => {
    try {
      await Driver.findByIdAndUpdate(user._id, { status: DRIVER_STATUS.ONLINE });
      socket.emit('driver:status_updated', { status: DRIVER_STATUS.ONLINE });
      console.log(`Driver ${user.name} went online`);
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  // Driver goes offline
  socket.on(SOCKET_EVENTS.DRIVER_GO_OFFLINE, async () => {
    try {
      await Driver.findByIdAndUpdate(user._id, { status: DRIVER_STATUS.OFFLINE });
      socket.emit('driver:status_updated', { status: DRIVER_STATUS.OFFLINE });
      console.log(`Driver ${user.name} went offline`);
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  // Driver updates their GPS location
  // Payload: { lat, lng }
  socket.on(SOCKET_EVENTS.DRIVER_UPDATE_LOCATION, async ({ lat, lng }) => {
    try {
      const driver = await Driver.findByIdAndUpdate(
        user._id,
        { currentLocation: { type: 'Point', coordinates: [lng, lat] } },
        { new: true }
      );

      // If driver is on a ride, broadcast location to the passenger(s)
      if (driver.currentRide) {
        const Ride = require('../models/ride.model');
        const ride = await Ride.findById(driver.currentRide).select('passenger sharedPassengers');

        if (ride) {
          const passengerIds = [
            ride.passenger?.toString(),
            ...ride.sharedPassengers.map((sp) => sp.passenger?.toString()),
          ].filter(Boolean);

          passengerIds.forEach((passengerId) => {
            const passengerSocket = getSocketByUserId(passengerId);
            if (passengerSocket) {
              io.to(passengerSocket).emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATED, {
                rideId: driver.currentRide,
                lat,
                lng,
              });
            }
          });
        }
      }
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  // Driver accepts a ride request
  // Payload: { rideId }
  socket.on(SOCKET_EVENTS.DRIVER_ACCEPT_RIDE, async ({ rideId }) => {
    try {
      const { ride, driver } = await rideService.driverAcceptRide(user._id, rideId);

      // Confirm to driver
      socket.emit(SOCKET_EVENTS.RIDE_ACCEPTED, { ride, otp: ride.otp });

      // Notify primary passenger
      const passengerSocket = getSocketByUserId(ride.passenger.toString());
      if (passengerSocket) {
        io.to(passengerSocket).emit(SOCKET_EVENTS.RIDE_ACCEPTED, {
          rideId: ride._id,
          driver: driver.toSafeObject(),
        });
      }

      // Notify shared passengers
      ride.sharedPassengers?.forEach((sp) => {
        const spSocket = getSocketByUserId(sp.passenger.toString());
        if (spSocket) {
          io.to(spSocket).emit(SOCKET_EVENTS.RIDE_ACCEPTED, {
            rideId: ride._id,
            driver: driver.toSafeObject(),
          });
        }
      });
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  // Driver rejects / ignores a ride request
  // Payload: { rideId }
  socket.on(SOCKET_EVENTS.DRIVER_REJECT_RIDE, ({ rideId }) => {
    // For now just log; in production you'd track rejected rides
    // and re-notify other nearby drivers
    console.log(`Driver ${user.name} rejected ride ${rideId}`);
    socket.emit(SOCKET_EVENTS.RIDE_REJECTED, { rideId });
  });

  // Driver starts the ride after OTP verification
  // Payload: { rideId, otp }
  socket.on(SOCKET_EVENTS.DRIVER_START_RIDE, async ({ rideId, otp }) => {
    try {
      const ride = await rideService.driverStartRide(user._id, rideId, otp);

      socket.emit(SOCKET_EVENTS.RIDE_STARTED, { rideId: ride._id });

      // Notify passenger(s)
      const passengerSocket = getSocketByUserId(ride.passenger.toString());
      if (passengerSocket) {
        io.to(passengerSocket).emit(SOCKET_EVENTS.RIDE_STARTED, { rideId: ride._id });
      }

      ride.sharedPassengers?.forEach((sp) => {
        const spSocket = getSocketByUserId(sp.passenger.toString());
        if (spSocket) {
          io.to(spSocket).emit(SOCKET_EVENTS.RIDE_STARTED, { rideId: ride._id });
        }
      });
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  // Driver completes the ride
  // Payload: { rideId }
  socket.on(SOCKET_EVENTS.DRIVER_COMPLETE_RIDE, async ({ rideId }) => {
    try {
      const ride = await rideService.driverCompleteRide(user._id, rideId);

      socket.emit(SOCKET_EVENTS.RIDE_COMPLETED, { rideId: ride._id, fare: ride.fare });

      // Notify passenger(s)
      const passengerSocket = getSocketByUserId(ride.passenger.toString());
      if (passengerSocket) {
        io.to(passengerSocket).emit(SOCKET_EVENTS.RIDE_COMPLETED, {
          rideId: ride._id,
          fare: ride.fare,
        });
      }

      ride.sharedPassengers?.forEach((sp) => {
        const spSocket = getSocketByUserId(sp.passenger.toString());
        if (spSocket) {
          io.to(spSocket).emit(SOCKET_EVENTS.RIDE_COMPLETED, {
            rideId: ride._id,
            fare: { estimated: sp.fare, actual: sp.fare },
          });
        }
      });
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  // Driver cancels an accepted ride
  // Payload: { rideId, reason }
  socket.on(SOCKET_EVENTS.DRIVER_CANCEL_RIDE, async ({ rideId, reason }) => {
    try {
      const ride = await rideService.cancelRide(rideId, 'driver', reason);

      socket.emit(SOCKET_EVENTS.RIDE_CANCELLED, { rideId });

      // Notify passenger(s)
      const passengerSocket = getSocketByUserId(ride.passenger.toString());
      if (passengerSocket) {
        io.to(passengerSocket).emit(SOCKET_EVENTS.RIDE_CANCELLED, {
          rideId,
          reason: 'Driver cancelled the ride',
        });
      }

      ride.sharedPassengers?.forEach((sp) => {
        const spSocket = getSocketByUserId(sp.passenger.toString());
        if (spSocket) {
          io.to(spSocket).emit(SOCKET_EVENTS.RIDE_CANCELLED, {
            rideId,
            reason: 'Driver cancelled the ride',
          });
        }
      });
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });
};

module.exports = registerDriverHandlers;