import { useState, useEffect } from 'react';
import { estimateFare, requestRide } from '../../services/api';
import { emitRequestRide, emitCancelRide } from '../../services/socket';
import { useSocket } from '../../hooks/useSocket';
import { Button, Input, Select, Card, Badge, Spinner, Modal, useToast, Toast } from '../shared/UI';

const VEHICLE_OPTIONS = [
  { value: 'bike', label: '🏍 Bike', base: 10, perKm: 5 },
  { value: 'auto', label: '🛺 Auto', base: 20, perKm: 8 },
  { value: 'mini', label: '🚗 Mini', base: 30, perKm: 10 },
  { value: 'sedan', label: '🚕 Sedan', base: 50, perKm: 14 },
  { value: 'suv', label: '🚙 SUV', base: 80, perKm: 18 },
];

const RIDE_TYPES = [
  { value: 'solo', label: 'Solo', desc: 'Your own ride' },
  { value: 'shared', label: 'Shared', desc: '30% cheaper' },
];

// Gender preference options (only shown when rideType === 'shared')
const GENDER_PREF_OPTIONS = [
  { value: 'any', label: 'Any co-passenger', icon: '👥' },
  { value: 'female_only', label: 'Women only', icon: '♀️' },
];

const statusMeta = {
  searching: { label: 'Finding your driver...', color: 'var(--blue)', icon: '🔍' },
  accepted: { label: 'Driver on the way!', color: 'var(--green)', icon: '🚗' },
  in_progress: { label: 'Ride in progress', color: 'var(--accent)', icon: '⚡' },
  completed: { label: 'Ride completed!', color: 'var(--green)', icon: '✅' },
  cancelled: { label: 'Ride cancelled', color: 'var(--red)', icon: '❌' },
};

export default function BookRide() {
  const { toast, show } = useToast();
  const [step, setStep] = useState('form'); // form | estimate | riding
  const [vehicleType, setVehicleType] = useState('sedan');
  const [rideType, setRideType] = useState('solo');
  const [genderPreference, setGenderPreference] = useState('any'); // 'any' | 'female_only'
  const [pickup, setPickup] = useState({ address: '', lat: '', lng: '' });
  const [dropoff, setDropoff] = useState({ address: '', lat: '', lng: '' });
  const [estimate, setEstimate] = useState(null);
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loadingEst, setLoadingEst] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useSocket({
    'ride:requested': (data) => { setRide(data); setStep('riding'); },
    'ride:accepted': (data) => {
      setRide(r => ({ ...r, status: 'accepted' }));
      setDriver(data.driver);
      show('Driver accepted your ride!', 'success');
    },
    'ride:started': () => {
      setRide(r => ({ ...r, status: 'in_progress' }));
      show('Your ride has started!', 'info');
    },
    'ride:completed': (data) => {
      setRide(r => ({ ...r, status: 'completed', fare: data.fare }));
      setShowRating(true);
    },
    'ride:cancelled': (data) => {
      setRide(r => ({ ...r, status: 'cancelled' }));
      show(`Ride cancelled: ${data.reason || 'No reason given'}`, 'error');
    },
    'driver:location_updated': (data) => {
      setDriver(d => d ? { ...d, currentLocation: { lat: data.lat, lng: data.lng } } : d);
    },
    // Notify passenger when a new co-passenger joins their shared ride
    'ride:share_passenger_joined': (data) => {
      show(`A co-passenger joined your shared ride! (${data.totalPassengers} total)`, 'info');
    },
  });

  const fetchCoordinates = async (address) => {
    try {
      const searchQuery = `${address}, Dehradun`;
      const viewbox = '77.90,30.40,78.15,30.20';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=${viewbox}&bounded=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const getEstimate = async () => {
    if (!pickup.address || !dropoff.address) return show('Enter pickup and dropoff addresses', 'warning');
    setLoadingEst(true);
    try {
      const pickupCoords = await fetchCoordinates(pickup.address);
      const dropoffCoords = await fetchCoordinates(dropoff.address);

      if (!pickupCoords || !dropoffCoords) {
        setLoadingEst(false);
        return show('Could not find coordinates for these addresses. Try adding a city name.', 'error');
      }

      setPickup(p => ({ ...p, lat: pickupCoords.lat, lng: pickupCoords.lng }));
      setDropoff(p => ({ ...p, lat: dropoffCoords.lat, lng: dropoffCoords.lng }));

      const { data } = await estimateFare({
        pickup: { address: pickup.address, coordinates: pickupCoords },
        dropoff: { address: dropoff.address, coordinates: dropoffCoords },
        vehicleType, rideType,
      });

      setEstimate(data.fare);
      setStep('estimate');
    } catch (e) {
      show(e.response?.data?.message || 'Failed to get estimate', 'error');
    } finally { setLoadingEst(false); }
  };

  const bookRide = async () => {
    setLoadingBook(true);
    try {
      const payload = {
        pickup: { address: pickup.address, coordinates: { lat: parseFloat(pickup.lat) || 28.6, lng: parseFloat(pickup.lng) || 77.2 } },
        dropoff: { address: dropoff.address, coordinates: { lat: parseFloat(dropoff.lat) || 28.55, lng: parseFloat(dropoff.lng) || 77.1 } },
        vehicleType,
        rideType,
        // Only include genderPreference when shared ride is selected
        ...(rideType === 'shared' && { genderPreference }),
      };
      const { data } = await requestRide(payload);
      setRide(data.ride);
      setStep('riding');
    } catch (e) {
      show(e.response?.data?.message || 'Failed to book ride', 'error');
    } finally { setLoadingBook(false); }
  };

  const cancel = async () => {
    if (ride?.rideId || ride?._id) {
      emitCancelRide(ride.rideId || ride._id, 'Passenger cancelled');
    }
    setStep('form'); setRide(null); setDriver(null); setEstimate(null);
  };

  const rideStatus = ride?.status;
  const meta = statusMeta[rideStatus] || {};

  return (
    <div style={{ padding: 28, maxWidth: 680, animation: 'fadeUp 0.3s ease' }}>
      {toast && <Toast {...toast} />}
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Book a Ride</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>Get a cab anywhere in the city</p>

      {step === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <h4 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Locations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', zIndex: 1 }} />
                <input placeholder="Pickup address" value={pickup.address}
                  onChange={e => setPickup(p => ({ ...p, address: e.target.value }))}
                  style={{ width: '100%', padding: '13px 16px 13px 34px', background: 'var(--bg3)', border: '1px solid var(--border)', borderBottom: 'none', borderRadius: '10px 10px 0 0', color: 'var(--text)', outline: 'none', fontSize: 15 }} />
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: 2, background: 'var(--red)', zIndex: 1 }} />
                <input placeholder="Dropoff address" value={dropoff.address}
                  onChange={e => setDropoff(p => ({ ...p, address: e.target.value }))}
                  style={{ width: '100%', padding: '13px 16px 13px 34px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '0 0 10px 10px', color: 'var(--text)', outline: 'none', fontSize: 15 }} />
              </div>
            </div>
          </Card>

          <Card>
            <h4 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vehicle</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {VEHICLE_OPTIONS.map(v => (
                <button key={v.value} onClick={() => setVehicleType(v.value)} style={{
                  padding: '10px 4px', borderRadius: 10, border: '1px solid',
                  borderColor: vehicleType === v.value ? 'var(--accent)' : 'var(--border)',
                  background: vehicleType === v.value ? 'var(--accent-glow)' : 'var(--surface2)',
                  color: vehicleType === v.value ? 'var(--accent)' : 'var(--text2)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{v.label.split(' ')[0]}</div>
                  {v.label.split(' ')[1]}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h4 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ride Type</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {RIDE_TYPES.map(rt => (
                <button key={rt.value} onClick={() => setRideType(rt.value)} style={{
                  padding: '14px 16px', borderRadius: 10, border: '1px solid',
                  borderColor: rideType === rt.value ? 'var(--accent)' : 'var(--border)',
                  background: rideType === rt.value ? 'var(--accent-glow)' : 'var(--surface2)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <p style={{ fontWeight: 700, color: rideType === rt.value ? 'var(--accent)' : 'var(--text)', fontSize: 15, marginBottom: 3 }}>{rt.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>{rt.desc}</p>
                </button>
              ))}
            </div>

            {/* Gender preference — only for shared rides */}
            {rideType === 'shared' && (
              <div style={{
                marginTop: 14, padding: 14,
                background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(168,85,247,0.08))',
                border: '1px solid rgba(236,72,153,0.2)',
                borderRadius: 10,
              }}>
                <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🛡️</span> Co-passenger Preference
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {GENDER_PREF_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setGenderPreference(opt.value)} style={{
                      padding: '10px 12px', borderRadius: 8, border: '1px solid',
                      borderColor: genderPreference === opt.value ? 'rgba(236,72,153,0.6)' : 'var(--border)',
                      background: genderPreference === opt.value ? 'rgba(236,72,153,0.12)' : 'var(--surface2)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}>
                      <p style={{ fontSize: 16, marginBottom: 3 }}>{opt.icon}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: genderPreference === opt.value ? '#ec4899' : 'var(--text2)' }}>{opt.label}</p>
                    </button>
                  ))}
                </div>
                {genderPreference === 'female_only' && (
                  <p style={{ fontSize: 11, color: 'rgba(236,72,153,0.7)', marginTop: 8 }}>
                    ℹ️ You'll only be matched with female co-passengers. This may increase wait time.
                  </p>
                )}
              </div>
            )}
          </Card>

          <Button loading={loadingEst} onClick={getEstimate} style={{ width: '100%' }}>
            Get Fare Estimate →
          </Button>
        </div>
      )}

      {step === 'estimate' && estimate && (
        <div style={{ animation: 'fadeUp 0.25s ease' }}>
          <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg3) 100%)' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>Estimated Fare</p>
              <div style={{ fontSize: 56, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                ₹{estimate.estimated}
              </div>
              {rideType === 'shared' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                  <Badge variant="success">30% shared discount</Badge>
                  {genderPreference === 'female_only' && (
                    <Badge variant="info">♀️ Women only</Badge>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 600 }}>{estimate.distanceKm} km</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>Distance</p>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 600 }}>₹{estimate.perKm}/km</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>Rate</p>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 600 }}>{vehicleType}</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>Vehicle</p>
                </div>
              </div>
            </div>
          </Card>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="ghost" onClick={() => setStep('form')} style={{ flex: 1 }}>← Back</Button>
            <Button loading={loadingBook} onClick={bookRide} style={{ flex: 2 }}>Confirm Ride 🚕</Button>
          </div>
        </div>
      )}

      {step === 'riding' && ride && (
        <div style={{ animation: 'fadeUp 0.25s ease' }}>
          <Card style={{ marginBottom: 20, borderColor: meta.color, background: `linear-gradient(135deg, var(--surface), var(--bg3))` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 40 }}>{meta.icon}</div>
              <div>
                <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700, color: meta.color }}>{meta.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>Ride ID: {ride.rideId || ride._id}</p>
              </div>
            </div>

            {rideStatus === 'searching' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Spinner size={20} />
                <span style={{ color: 'var(--text2)', fontSize: 14 }}>Matching you with a nearby driver...</span>
              </div>
            )}

            {ride.otp && rideStatus !== 'in_progress' && rideStatus !== 'completed' && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 18px',
                background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                borderRadius: 10, marginTop: rideStatus === 'searching' ? 16 : 0,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>OTP</span>
                <span style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)', letterSpacing: 6 }}>{ride.otp}</span>
              </div>
            )}
          </Card>

          {driver && (
            <Card style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 14, color: 'var(--text2)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Driver</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#0a0a0f',
                }}>
                  {driver.name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 16 }}>{driver.name}</p>
                  <p style={{ color: 'var(--text2)', fontSize: 13 }}>⭐ {driver.rating} · {driver.vehicle?.model} · {driver.vehicle?.plateNumber}</p>
                </div>
                <a href={`tel:${driver.phone}`} style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>📞</a>
              </div>
            </Card>
          )}

          {rideStatus === 'completed' && ride.fare && (
            <Card style={{ marginBottom: 16, borderColor: 'var(--green)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--text2)', fontSize: 13 }}>Final Fare</p>
                  <p style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
                    ₹{ride.fare.actual || ride.fare.estimated}
                  </p>
                </div>
                <Badge variant="success">Completed</Badge>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {(rideStatus === 'searching' || rideStatus === 'accepted') && (
              <Button variant="danger" onClick={cancel} style={{ flex: 1 }}>Cancel Ride</Button>
            )}
            {rideStatus === 'completed' && (
              <>
                <Button variant="ghost" onClick={() => { setStep('form'); setRide(null); setDriver(null); }} style={{ flex: 1 }}>Book Another</Button>
                <Button onClick={() => setShowRating(true)} style={{ flex: 1 }}>Rate Ride ⭐</Button>
              </>
            )}
            {rideStatus === 'cancelled' && (
              <Button onClick={() => { setStep('form'); setRide(null); }} style={{ flex: 1 }}>Book Again</Button>
            )}
          </div>
        </div>
      )}

      <RatingModal open={showRating} rideId={ride?.rideId || ride?._id} onClose={() => setShowRating(false)} show={show} />
    </div>
  );
}

function RatingModal({ open, rideId, onClose, show }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rideId) { onClose(); return; }
    setLoading(true);
    try {
      const { rateRide } = await import('../../services/api');
      await rateRide(rideId, { rating, review });
      show('Rating submitted!', 'success');
      onClose();
    } catch { show('Failed to submit rating', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Rate your ride">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} onClick={() => setRating(s)} style={{
            flex: 1, padding: '12px 0', border: '1px solid',
            borderColor: rating >= s ? 'var(--accent)' : 'var(--border)',
            background: rating >= s ? 'var(--accent-glow)' : 'var(--surface2)',
            borderRadius: 8, fontSize: 24, cursor: 'pointer',
          }}>⭐</button>
        ))}
      </div>
      <Input label="Review (optional)" placeholder="Great ride!" value={review} onChange={e => setReview(e.target.value)} />
      <Button loading={loading} onClick={submit} style={{ width: '100%' }}>Submit Rating</Button>
    </Modal>
  );
}