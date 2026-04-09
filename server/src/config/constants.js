module.exports = {
  ROLES: {
    PASSENGER: 'passenger',
    DRIVER: 'driver',
    ADMIN: 'admin',
  },

  RIDE_STATUS: {
    REQUESTED: 'requested',       // Passenger requested ride
    SEARCHING: 'searching',       // Looking for available drivers
    ACCEPTED: 'accepted',         // Driver accepted
    DRIVER_ARRIVING: 'driver_arriving',
    IN_PROGRESS: 'in_progress',   // Ride started
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  RIDE_TYPE: {
    SOLO: 'solo',         // Private ride
    SHARED: 'shared',     // Ride sharing with other passengers
  },

  VEHICLE_TYPES: {
    BIKE: 'bike',
    AUTO: 'auto',
    MINI: 'mini',
    SEDAN: 'sedan',
    SUV: 'suv',
  },

  DRIVER_STATUS: {
    OFFLINE: 'offline',
    ONLINE: 'online',       // Available for rides
    ON_RIDE: 'on_ride',
  },

  SOCKET_EVENTS: {
    // Driver events
    DRIVER_GO_ONLINE: 'driver:go_online',
    DRIVER_GO_OFFLINE: 'driver:go_offline',
    DRIVER_UPDATE_LOCATION: 'driver:update_location',
    DRIVER_ACCEPT_RIDE: 'driver:accept_ride',
    DRIVER_REJECT_RIDE: 'driver:reject_ride',
    DRIVER_START_RIDE: 'driver:start_ride',
    DRIVER_COMPLETE_RIDE: 'driver:complete_ride',
    DRIVER_CANCEL_RIDE: 'driver:cancel_ride',

    // Passenger events
    PASSENGER_REQUEST_RIDE: 'passenger:request_ride',
    PASSENGER_CANCEL_RIDE: 'passenger:cancel_ride',

    // Server -> Client broadcasts
    RIDE_REQUEST_INCOMING: 'ride:request_incoming',
    RIDE_ACCEPTED: 'ride:accepted',
    RIDE_REJECTED: 'ride:rejected',
    RIDE_STARTED: 'ride:started',
    RIDE_COMPLETED: 'ride:completed',
    RIDE_CANCELLED: 'ride:cancelled',
    DRIVER_LOCATION_UPDATED: 'driver:location_updated',
    RIDE_SHARE_PASSENGER_JOINED: 'ride:share_passenger_joined',

    // System
    ERROR: 'error',
    AUTH_REQUIRED: 'auth_required',
  },

  // Shared ride: max passengers
  MAX_SHARED_PASSENGERS: 3,

  // Distance in km for finding nearby drivers
  NEARBY_DRIVER_RADIUS_KM: 5,
};
