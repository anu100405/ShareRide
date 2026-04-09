import { useState } from 'react';
import { getNearbyDrivers } from '../../services/api';
import { Button, Select, Card, Badge, Spinner, useToast, Toast } from '../shared/UI';

const VEHICLE_OPTIONS = ['bike', 'auto', 'mini', 'sedan', 'suv'].map(v => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

const vehicleEmoji = { bike: '🏍', auto: '🛺', mini: '🚗', sedan: '🚕', suv: '🚙' };

export default function NearbyDrivers() {
  const { toast, show } = useToast();
  const [lat, setLat] = useState('28.6315');
  const [lng, setLng] = useState('77.2167');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toString()); setLng(pos.coords.longitude.toString()); show('Location updated!', 'success'); },
      () => show('Could not get location', 'error')
    );
  };

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await getNearbyDrivers(lat, lng, vehicleType);
      setDrivers(data.drivers || []);
    } catch (e) {
      show(e.response?.data?.message || 'Failed to fetch drivers', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 28, maxWidth: 680, animation: 'fadeUp 0.3s ease' }}>
      {toast && <Toast {...toast} />}

      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Nearby Drivers</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>
        See available drivers around your location
      </p>

      <Card style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Search Parameters
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Latitude
            </label>
            <input
              type="number" step="0.001" value={lat}
              onChange={e => setLat(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', outline: 'none', fontSize: 15 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Longitude
            </label>
            <input
              type="number" step="0.001" value={lng}
              onChange={e => setLng(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', outline: 'none', fontSize: 15 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <Select
            label="Vehicle Type"
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value)}
            options={VEHICLE_OPTIONS}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Button variant="ghost" onClick={locate} style={{ height: 46, flexShrink: 0 }}>
            📍 My Location
          </Button>
          <Button loading={loading} onClick={search} style={{ height: 46, flexShrink: 0 }}>
            Search
          </Button>
        </div>
      </Card>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={32} />
        </div>
      )}

      {!loading && searched && drivers.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ color: 'var(--text2)', marginBottom: 6 }}>No drivers found nearby</p>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Try a different vehicle type or expand your radius</p>
        </Card>
      )}

      {!loading && drivers.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              Found <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{drivers.length}</span> driver{drivers.length !== 1 ? 's' : ''} nearby
            </p>
            <Badge variant="success">Within 5km</Badge>
          </div>

          {/* Visual map placeholder */}
          <Card style={{ marginBottom: 16, padding: 0, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: 180,
              background: 'linear-gradient(135deg, #0d1520 0%, #0a1a10 50%, #0d1520 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Grid lines */}
              {[...Array(8)].map((_, i) => (
                <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 14}%`, height: 1, background: 'rgba(255,255,255,0.04)' }} />
              ))}
              {[...Array(12)].map((_, i) => (
                <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 9}%`, width: 1, background: 'rgba(255,255,255,0.04)' }} />
              ))}

              {/* Driver dots */}
              {drivers.map((driver, i) => {
                const spreadX = ((i * 137) % 70) + 5;
                const spreadY = ((i * 89) % 70) + 5;
                return (
                  <div key={driver.id} title={driver.name} style={{
                    position: 'absolute', left: `${spreadX}%`, top: `${spreadY}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'default',
                  }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', inset: -4, borderRadius: '50%',
                        background: 'rgba(240,192,64,0.2)',
                        animation: 'ping 2s infinite',
                        animationDelay: `${i * 0.4}s`,
                      }} />
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--accent)', border: '2px solid var(--bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, position: 'relative',
                      }}>
                        {vehicleEmoji[driver.vehicle?.type] || '🚗'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* You marker */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--blue)', border: '3px solid var(--bg)',
                  boxShadow: '0 0 0 4px rgba(91,156,246,0.3)',
                }} />
              </div>

              <div style={{
                position: 'absolute', bottom: 10, left: 12, right: 12,
                display: 'flex', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--blue)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>You</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>Available drivers</span>
                </div>
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drivers.map((driver, i) => (
              <Card key={driver.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: `hsl(${(i * 60) % 360}, 60%, 40%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff',
                    flexShrink: 0,
                  }}>
                    {driver.name?.[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontWeight: 600, fontSize: 15 }}>{driver.name}</p>
                      <Badge variant="warning">⭐ {driver.rating}</Badge>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                      {vehicleEmoji[driver.vehicle?.type]} {driver.vehicle?.model} · {driver.vehicle?.plateNumber}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                      <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Available</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      [{driver.location?.[1]?.toFixed(3)}, {driver.location?.[0]?.toFixed(3)}]
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
