import { Card } from '../shared/UI';

const fareData = [
  { vehicle: 'Bike', emoji: '🏍', base: 10, perKm: 5, capacity: 1, desc: 'Quick solo trips' },
  { vehicle: 'Auto', emoji: '🛺', base: 20, perKm: 8, capacity: 3, desc: 'Budget-friendly' },
  { vehicle: 'Mini', emoji: '🚗', base: 30, perKm: 10, capacity: 4, desc: 'Compact AC cab' },
  { vehicle: 'Sedan', emoji: '🚕', base: 50, perKm: 14, capacity: 4, desc: 'Comfortable ride' },
  { vehicle: 'SUV', emoji: '🚙', base: 80, perKm: 18, capacity: 6, desc: 'Spacious & premium' },
];

function estimateFare(base, perKm, km, shared) {
  const total = base + perKm * km;
  return shared ? Math.round(total * 0.7) : total;
}

export default function FareGuide() {
  return (
    <div style={{ padding: 28, maxWidth: 720, animation: 'fadeUp 0.3s ease' }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Fare Guide</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>
        Transparent pricing for all vehicle types
      </p>

      {/* Fare cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        {fareData.map(f => (
          <Card key={f.vehicle} style={{ padding: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{f.emoji}</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{f.vehicle}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>{f.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>Base fare</span>
                <span style={{ fontWeight: 600 }}>₹{f.base}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>Per km</span>
                <span style={{ fontWeight: 600 }}>₹{f.perKm}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>Capacity</span>
                <span style={{ fontWeight: 600 }}>{f.capacity} seat{f.capacity > 1 ? 's' : ''}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--green)' }}>Shared (30% off)</span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>₹{Math.round(f.perKm * 0.7)}/km</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Fare estimator */}
      <Card>
        <h3 style={{ fontSize: 18, marginBottom: 4 }}>Quick Fare Estimator</h3>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
          Estimated fares for common distances (includes base fare)
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text3)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                  Vehicle
                </th>
                {[5, 10, 15, 20].map(km => (
                  <th key={km} style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text3)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                    {km} km
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fareData.map((f, i) => (
                <tr key={f.vehicle} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px 12px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ marginRight: 8 }}>{f.emoji}</span>
                    <span style={{ fontWeight: 600 }}>{f.vehicle}</span>
                  </td>
                  {[5, 10, 15, 20].map(km => (
                    <td key={km} style={{ textAlign: 'right', padding: '12px 12px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 600 }}>₹{estimateFare(f.base, f.perKm, km, false)}</div>
                      <div style={{ fontSize: 11, color: 'var(--green)' }}>₹{estimateFare(f.base, f.perKm, km, true)} shared</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--accent-glow)', border: '1px solid rgba(240,192,64,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            💡 <strong style={{ color: 'var(--accent)' }}>Shared rides</strong> are 30% cheaper and great for solo passengers heading in the same direction. Actual fare may vary based on traffic and route.
          </p>
        </div>
      </Card>
    </div>
  );
}
