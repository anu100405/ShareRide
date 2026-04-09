import { useState } from 'react';
import { getSharedRides, joinSharedRide } from '../../services/api';
import { Button, Select, Card, Badge, Spinner, Input, Modal, useToast, Toast } from '../shared/UI';

const VEHICLE_OPTIONS = ['bike', 'auto', 'mini', 'sedan', 'suv'].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

export default function SharedRides() {
  const { toast, show } = useToast();
  const [vehicleType, setVehicleType] = useState('mini');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);
  const [joinData, setJoinData] = useState({ pickup: '', dropoff: '', pickupLat: '', pickupLng: '', dropoffLat: '', dropoffLng: '' });

  const search = async () => {
    setLoading(true);
    try {
      const { data } = await getSharedRides(vehicleType);
      setRides(data.rides || data.data || []);
    } catch (e) {
      show(e.response?.data?.message || 'Error fetching rides', 'error');
    } finally { setLoading(false); }
  };

  const join = async () => {
    try {
      await joinSharedRide(joining._id, {
        pickup: { address: joinData.pickup, coordinates: { lat: parseFloat(joinData.pickupLat) || 28.56, lng: parseFloat(joinData.pickupLng) || 77.24 } },
        dropoff: { address: joinData.dropoff, coordinates: { lat: parseFloat(joinData.dropoffLat) || 28.55, lng: parseFloat(joinData.dropoffLng) || 77.1 } },
      });
      show('Successfully joined shared ride!', 'success');
      setJoining(null);
    } catch (e) {
      show(e.response?.data?.message || 'Failed to join', 'error');
    }
  };

  return (
    <div style={{ padding: 28, maxWidth: 680, animation: 'fadeUp 0.3s ease' }}>
      {toast && <Toast {...toast} />}
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Shared Rides</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>Split the cost with other passengers going your way</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end' }}>
        <Select label="Vehicle Type" value={vehicleType} onChange={e => setVehicleType(e.target.value)}
          options={VEHICLE_OPTIONS} style={{ flex: 1, marginBottom: 0 }} />
        <Button loading={loading} onClick={search} style={{ height: 46, marginBottom: 0 }}>Search</Button>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>}

      {!loading && rides.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
          <p style={{ color: 'var(--text2)' }}>No shared rides available. Try a different vehicle type.</p>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rides.map(ride => {
          const seats = ride.vehicle?.capacity - (ride.sharedPassengers?.length || 0) - 1;
          return (
            <Card key={ride._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Badge variant="info">{ride.vehicleType}</Badge>
                    <Badge variant="success">{seats} seat{seats !== 1 ? 's' : ''} left</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                    {ride.sharedPassengers?.length + 1 || 1} passengers
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
                    ₹{ride.fare?.estimated}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--green)' }}>30% discount applied</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', marginTop: 5, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>{ride.pickup?.address}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)', marginTop: 5, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>{ride.dropoff?.address}</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setJoining(ride)} style={{ width: '100%' }} variant="secondary">
                Join this Ride →
              </Button>
            </Card>
          );
        })}
      </div>

      <Modal open={!!joining} onClose={() => setJoining(null)} title="Join Shared Ride">
        <Input label="Your Pickup Address" placeholder="Lajpat Nagar, Delhi" value={joinData.pickup}
          onChange={e => setJoinData(d => ({ ...d, pickup: e.target.value }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Input label="Pickup Lat" type="number" value={joinData.pickupLat}
            onChange={e => setJoinData(d => ({ ...d, pickupLat: e.target.value }))} />
          <Input label="Pickup Lng" type="number" value={joinData.pickupLng}
            onChange={e => setJoinData(d => ({ ...d, pickupLng: e.target.value }))} />
        </div>
        <Input label="Your Dropoff Address" placeholder="IGI Airport, Delhi" value={joinData.dropoff}
          onChange={e => setJoinData(d => ({ ...d, dropoff: e.target.value }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Input label="Dropoff Lat" type="number" value={joinData.dropoffLat}
            onChange={e => setJoinData(d => ({ ...d, dropoffLat: e.target.value }))} />
          <Input label="Dropoff Lng" type="number" value={joinData.dropoffLng}
            onChange={e => setJoinData(d => ({ ...d, dropoffLng: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button variant="ghost" onClick={() => setJoining(null)} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={join} style={{ flex: 1 }}>Confirm Join</Button>
        </div>
      </Modal>
    </div>
  );
}
