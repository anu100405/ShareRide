import { useState, useEffect } from 'react';
import { getEarnings, getDriverRides } from '../../services/api';
import { Card, Badge, Spinner } from '../shared/UI';

export default function DriverEarnings() {
  const [earnings, setEarnings] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEarnings(), getDriverRides(1)])
      .then(([e, r]) => {
        setEarnings(e.data.earnings);
        setRides(r.data.rides || r.data.data || []);
      }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div>;

  return (
    <div style={{ padding: 28, maxWidth: 680, animation: 'fadeUp 0.3s ease' }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Earnings</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>Your earnings and performance overview</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Earnings', value: `₹${earnings?.total || 0}`, color: 'var(--accent)' },
          { label: "Today's Earnings", value: `₹${earnings?.today || 0}`, color: 'var(--green)' },
          { label: 'Total Rides', value: earnings?.totalRides || 0, color: 'var(--blue)' },
          { label: 'Average Rating', value: `⭐ ${earnings?.rating || '—'}`, color: 'var(--text)' },
        ].map(stat => (
          <Card key={stat.label} style={{ padding: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{stat.label}</p>
            <p style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 800, color: stat.color }}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <h3 style={{ fontSize: 18, marginBottom: 16 }}>Recent Rides</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rides.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text2)' }}>No rides yet</p>
          </Card>
        )}
        {rides.map(ride => (
          <Card key={ride._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <Badge variant={ride.status === 'completed' ? 'success' : 'danger'}>{ride.status}</Badge>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {ride.completedAt ? new Date(ride.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{ride.pickup?.address?.substring(0, 35)}...</p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>{ride.distance} km · {ride.vehicleType}</p>
            </div>
            <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
              ₹{ride.fare?.actual || ride.fare?.estimated || '—'}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
