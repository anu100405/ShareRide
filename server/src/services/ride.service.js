const Ride = require('../models/ride.model');
const Driver = require('../models/driver.model');
const User = require('../models/user.model');
const { RIDE_STATUS, RIDE_TYPE, DRIVER_STATUS, NEARBY_DRIVER_RADIUS_KM, MAX_SHARED_PASSENGERS } = require('../config/constants');
const { calculateFare } = require('./fare.service');
const { getIO, getSocketByUserId } = require('../sockets/socket.store');
const { SOCKET_EVENTS } = require('../config/constants');

// Generate 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Find nearby available drivers using geospatial query
const findNearbyDrivers = async (pickupCoords, vehicleType, radiusKm = NEARBY_DRIVER_RADIUS_KM) => {
  return Driver.find();
};

// Notify nearby drivers of a new ride request
const notifyNearbyDrivers = async (ride) => {
  const io = getIO();
  const drivers = await findNearbyDrivers(ride.pickup.coordinates, ride.vehicleType);

  if (!drivers.length) return false;

  const ridePayload = {
    rideId: ride._id,
    rideType: ride.rideType,
    vehicleType: ride.vehicleType,
    pickup: ride.pickup,
    dropoff: ride.dropoff,
    fare: ride.fare,
    distance: ride.distance,
    passengerCount: ride.rideType === RIDE_TYPE.SHARED
      ? ride.sharedPassengers.length + 1
      : 1,
  };

  drivers.forEach((driver) => {
    const driverSocket = getSocketByUserId(driver._id.toString());
    console.log(driverSocket);
    if (driverSocket) {
      io.to(driverSocket).emit(SOCKET_EVENTS.RIDE_REQUEST_INCOMING, ridePayload);
    }
  });

  return true;
};

// Create a new solo or shared ride
const createRide = async ({ passengerId, pickup, dropoff, vehicleType, rideType }) => {
  const fareInfo = calculateFare(vehicleType, pickup.coordinates, dropoff.coordinates, rideType);

  const rideData = {
    rideType,
    vehicleType,
    pickup,
    dropoff,
    passenger: passengerId,
    fare: {
      estimated: fareInfo.estimated,
      perKm: fareInfo.perKm,
    },
    distance: fareInfo.distanceKm,
    status: RIDE_STATUS.SEARCHING,
    otp: generateOTP(),
    maxPassengers: rideType === RIDE_TYPE.SHARED ? MAX_SHARED_PASSENGERS : 1,
  };

  const ride = await Ride.create(rideData);
  await User.findByIdAndUpdate(passengerId, { $push: { rideHistory: ride._id } });

  // Broadcast to nearby drivers
  const driversFound = await notifyNearbyDrivers(ride);
  if (!driversFound) {
    ride.status = RIDE_STATUS.CANCELLED;
    ride.cancelledBy = 'system';
    ride.cancelReason = 'No drivers available nearby';
    await ride.save();
    throw new Error('No drivers available nearby');
  }

  return ride;
};

// Join an existing shared ride as a new passenger
const joinSharedRide = async ({ rideId, passengerId, pickup, dropoff }) => {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new Error('Ride not found');
  if (ride.rideType !== RIDE_TYPE.SHARED) throw new Error('This is not a shared ride');
  if (ride.status !== RIDE_STATUS.SEARCHING && ride.status !== RIDE_STATUS.ACCEPTED) {
    throw new Error('Cannot join this ride at this stage');
  }

  const currentPassengers = ride.sharedPassengers.length + 1; // +1 for primary passenger
  if (currentPassengers >= ride.maxPassengers) {
    throw new Error('Shared ride is full');
  }

  const fareInfo = calculateFare(ride.vehicleType, pickup.coordinates, dropoff.coordinates, RIDE_TYPE.SHARED);

  ride.sharedPassengers.push({
    passenger: passengerId,
    pickup,
    dropoff,
    fare: fareInfo.estimated,
  });

  await ride.save();
  await User.findByIdAndUpdate(passengerId, { $push: { rideHistory: ride._id } });

  // Notify driver if already assigned
  if (ride.driver) {
    const driverSocket = getSocketByUserId(ride.driver.toString());
    const io = getIO();
    if (driverSocket) {
      io.to(driverSocket).emit(SOCKET_EVENTS.RIDE_SHARE_PASSENGER_JOINED, {
        rideId: ride._id,
        newPassenger: { pickup, dropoff, fare: fareInfo.estimated },
        totalPassengers: currentPassengers + 1,
      });
    }
  }

  return ride;
};

// Driver accepts a ride
const driverAcceptRide = async (driverId, rideId) => {
  const [ride, driver] = await Promise.all([
    Ride.findById(rideId),
    Driver.findById(driverId),
  ]);

  if (!ride) throw new Error('Ride not found');
  if (ride.status !== RIDE_STATUS.SEARCHING) throw new Error('Ride is no longer available');
  if (!driver || driver.status !== DRIVER_STATUS.ONLINE) throw new Error('Driver not available');

  ride.driver = driverId;
  ride.status = RIDE_STATUS.ACCEPTED;
  await ride.save();

  driver.status = DRIVER_STATUS.ON_RIDE;
  driver.currentRide = ride._id;
  await driver.save();

  return { ride, driver };
};

// Driver starts the ride (after OTP verification)
const driverStartRide = async (driverId, rideId, otp) => {
  const ride = await Ride.findById(rideId).populate('passenger', 'name phone');
  if (!ride) throw new Error('Ride not found');
  if (ride.driver.toString() !== driverId.toString()) throw new Error('Not your ride');
  if (ride.status !== RIDE_STATUS.ACCEPTED) throw new Error('Ride not in accepted state');
  if (ride.otp !== otp) throw new Error('Invalid OTP');

  ride.status = RIDE_STATUS.IN_PROGRESS;
  ride.startedAt = new Date();
  await ride.save();

  return ride;
};

// Driver completes the ride
const driverCompleteRide = async (driverId, rideId) => {
  const ride = await Ride.findById(rideId).populate('passenger', 'name phone');
  if (!ride) throw new Error('Ride not found');
  if (ride.driver.toString() !== driverId.toString()) throw new Error('Not your ride');
  if (ride.status !== RIDE_STATUS.IN_PROGRESS) throw new Error('Ride not in progress');

  ride.status = RIDE_STATUS.COMPLETED;
  ride.completedAt = new Date();
  ride.fare.actual = ride.fare.estimated;

  // Mark all shared passengers as dropped off
  ride.sharedPassengers.forEach((sp) => {
    if (sp.status !== 'cancelled') sp.status = 'dropped_off';
  });
  await ride.save();

  // Update driver stats
  await Driver.findByIdAndUpdate(driverId, {
    status: DRIVER_STATUS.ONLINE,
    currentRide: null,
    $inc: { totalRides: 1, totalEarnings: ride.fare.actual },
  });

  return ride;
};

// Cancel a ride
const cancelRide = async (rideId, cancelledBy, reason) => {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new Error('Ride not found');

  const cancellableStatuses = [RIDE_STATUS.REQUESTED, RIDE_STATUS.SEARCHING, RIDE_STATUS.ACCEPTED];
  if (!cancellableStatuses.includes(ride.status)) {
    throw new Error('Cannot cancel a ride that is in progress or completed');
  }

  ride.status = RIDE_STATUS.CANCELLED;
  ride.cancelledAt = new Date();
  ride.cancelledBy = cancelledBy;
  ride.cancelReason = reason || 'No reason provided';
  await ride.save();

  // Free up driver if assigned
  if (ride.driver) {
    await Driver.findByIdAndUpdate(ride.driver, {
      status: DRIVER_STATUS.ONLINE,
      currentRide: null,
    });
  }

  return ride;
};

// Rate a completed ride
const rateRide = async (rideId, raterId, raterRole, rating, review) => {
  const ride = await Ride.findById(rideId);
  if (!ride || ride.status !== RIDE_STATUS.COMPLETED) {
    throw new Error('Ride not found or not completed');
  }

  if (raterRole === 'passenger') {
    ride.driverRating = rating;
    ride.driverReview = review;
    await ride.save();

    // Update driver rating average
    const driver = await Driver.findById(ride.driver);
    driver.rating = ((driver.rating * driver.totalRatings) + rating) / (driver.totalRatings + 1);
    driver.totalRatings += 1;
    await driver.save();
  } else {
    ride.passengerRating = rating;
    ride.passengerReview = review;
    await ride.save();

    // Update passenger rating average
    const user = await User.findById(ride.passenger);
    user.rating = ((user.rating * user.totalRatings) + rating) / (user.totalRatings + 1);
    user.totalRatings += 1;
    await user.save();
  }

  return ride;
};

module.exports = {
  createRide,
  joinSharedRide,
  driverAcceptRide,
  driverStartRide,
  driverCompleteRide,
  cancelRide,
  rateRide,
  findNearbyDrivers,
  notifyNearbyDrivers,
};