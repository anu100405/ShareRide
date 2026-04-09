import { useState, useEffect } from 'react';
import { getDriverRides } from '../../services/api';
import { Card, Badge, Spinner } from '../shared/UI';

const statusVariant = {
  completed: 'success',
  cancelled: 'danger',
  in_progress: 'warning',
  searching: 'info',
  accepted: 'info',
};

export default function DriverRideHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDriverRides(page)
      .then(({ data }) => {
        const list = data.rides || data.data || [];
        setRides(list);
        setHasMore(list.length === 10);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div style={{ padding: 28, maxWidth: 680, animation: 'fadeUp 0.3s ease' }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Ride History</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>All your completed and past rides</p>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={32} />
        </div>
      )}

      {!loading && rides.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
          <p style={{ color: 'var(--text2)' }}>No rides yet. Go online to start accepting rides!</p>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rides.map(ride => (
          <Card key={ride._id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <Badge variant={statusVariant[ride.status] || 'default'}>
                  {ride.status?.replace('_', ' ')}
                </Badge>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                  {ride.completedAt
                    ? new Date(ride.completedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
                  ₹{ride.fare?.actual || ride.fare?.estimated || '—'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {ride.distance} km · {ride.vehicleType}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', marginTop: 5, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 }}>{ride.pickup?.address}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)', marginTop: 5, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 }}>{ride.dropoff?.address}</p>
              </div>
            </div>

            {ride.passenger && (
              <div style={{
                marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Passenger: <span style={{ color: 'var(--text2)' }}>{ride.passenger?.name}</span>
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {ride.passengerRating && (
                    <p style={{ fontSize: 12, color: 'var(--accent)' }}>⭐ {ride.passengerRating}</p>
                  )}
                  {ride.rideType === 'shared' && (
                    <Badge variant="info">shared</Badge>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {!loading && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer',
              color: page === 1 ? 'var(--text3)' : 'var(--text)', fontFamily: 'var(--font-display)',
            }}
          >
            ← Prev
          </button>
          <span style={{ padding: '8px 16px', color: 'var(--text2)', fontSize: 14 }}>Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', cursor: !hasMore ? 'not-allowed' : 'pointer',
              color: !hasMore ? 'var(--text3)' : 'var(--text)', fontFamily: 'var(--font-display)',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
