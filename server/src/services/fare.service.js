const { VEHICLE_TYPES, RIDE_TYPE } = require('../config/constants');

// Base fares per km in INR
const FARE_TABLE = {
  [VEHICLE_TYPES.BIKE]:  { base: 10, perKm: 5,  perMin: 0.5 },
  [VEHICLE_TYPES.AUTO]:  { base: 20, perKm: 8,  perMin: 0.75 },
  [VEHICLE_TYPES.MINI]:  { base: 30, perKm: 10, perMin: 1 },
  [VEHICLE_TYPES.SEDAN]: { base: 50, perKm: 14, perMin: 1.5 },
  [VEHICLE_TYPES.SUV]:   { base: 80, perKm: 18, perMin: 2 },
};

// Haversine formula — returns distance in km
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateFare = (vehicleType, pickupCoords, dropoffCoords, rideType = RIDE_TYPE.SOLO) => {
  const { lat: lat1, lng: lng1 } = pickupCoords;
  const { lat: lat2, lng: lng2 } = dropoffCoords;

  const distanceKm = haversineDistance(lat1, lng1, lat2, lng2);
  const fareConfig = FARE_TABLE[vehicleType] || FARE_TABLE[VEHICLE_TYPES.MINI];
  let fare = fareConfig.base + distanceKm * fareConfig.perKm;

  // Shared rides are 30% cheaper
  if (rideType === RIDE_TYPE.SHARED) {
    fare = fare * 0.7;
  }

  return {
    estimated: Math.round(fare),
    perKm: fareConfig.perKm,
    distanceKm: Math.round(distanceKm * 10) / 10,
  };
};

module.exports = { calculateFare, haversineDistance };