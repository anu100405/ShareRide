import { useState, useEffect } from 'react';
import { getPassengerProfile, updatePassengerProfile, getDriverProfile, updateDriverProfile, saveAddress, deleteAddress } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, Badge, Spinner, useToast, Toast } from '../shared/UI';

export default function Profile() {
  const { user } = useAuth();
  const { toast, show } = useToast();
  const isDriver = user?.role === 'driver';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [newAddress, setNewAddress] = useState({ label: '', address: '', lat: '', lng: '' });
  const [addingAddr, setAddingAddr] = useState(false);

  useEffect(() => {
    const fn = isDriver ? getDriverProfile : getPassengerProfile;
    fn().then(({ data }) => {
      const p = data.driver || data.user || data;
      setProfile(p);
      setForm({ name: p.name || '', phone: p.phone || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const fn = isDriver ? updateDriverProfile : updatePassengerProfile;
      await fn(form);
      show('Profile updated!', 'success');
    } catch (e) {
      show(e.response?.data?.message || 'Failed to update', 'error');
    } finally { setSaving(false); }
  };

  const addAddress = async () => {
    try {
      await saveAddress({ label: newAddress.label, address: newAddress.address, coordinates: { lat: parseFloat(newAddress.lat), lng: parseFloat(newAddress.lng) } });
      show('Address saved!', 'success');
      setNewAddress({ label: '', address: '', lat: '', lng: '' });
      setAddingAddr(false);
      const { data } = await getPassengerProfile();
      setProfile(data.user || data);
    } catch (e) { show('Failed to save address', 'error'); }
  };

  const removeAddress = async (id) => {
    try {
      await deleteAddress(id);
      setProfile(p => ({ ...p, savedAddresses: p.savedAddresses?.filter(a => a._id !== id) }));
      show('Address removed', 'info');
    } catch { show('Failed to remove', 'error'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div>;

  return (
    <div style={{ padding: 28, maxWidth: 560, animation: 'fadeUp 0.3s ease' }}>
      {toast && <Toast {...toast} />}
      <h2 style={{ fontSize: 26, marginBottom: 28 }}>My Profile</h2>

      {/* Avatar + basic info */}
      <Card style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#0a0a0f',
          flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>{profile?.name}</p>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>{profile?.email}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Badge variant={isDriver ? 'warning' : 'info'}>{user?.role}</Badge>
            {isDriver && profile?.status && <Badge variant={profile.status === 'online' ? 'success' : 'default'}>{profile.status}</Badge>}
            {isDriver && <Badge variant="default">⭐ {profile?.rating}</Badge>}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Edit Info</h4>
        <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <Button loading={saving} onClick={save} style={{ width: '100%' }}>Save Changes</Button>
      </Card>

      {isDriver && profile?.vehicle && (
        <Card style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vehicle Info</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Type', profile.vehicle.type],
              ['Model', profile.vehicle.model],
              ['Plate', profile.vehicle.plateNumber],
              ['Color', profile.vehicle.color],
              ['Capacity', profile.vehicle.capacity + ' seats'],
              ['Total Rides', profile.totalRides],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</p>
                <p style={{ fontWeight: 600, marginTop: 2 }}>{v}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!isDriver && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saved Addresses</h4>
            <button onClick={() => setAddingAddr(a => !a)} style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              + Add
            </button>
          </div>

          {addingAddr && (
            <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 10, marginBottom: 14 }}>
              <Input label="Label (home/work)" placeholder="home" value={newAddress.label} onChange={e => setNewAddress(a => ({ ...a, label: e.target.value }))} />
              <Input label="Address" placeholder="123 MG Road" value={newAddress.address} onChange={e => setNewAddress(a => ({ ...a, address: e.target.value }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Input label="Lat" type="number" value={newAddress.lat} onChange={e => setNewAddress(a => ({ ...a, lat: e.target.value }))} />
                <Input label="Lng" type="number" value={newAddress.lng} onChange={e => setNewAddress(a => ({ ...a, lng: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" onClick={() => setAddingAddr(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button onClick={addAddress} style={{ flex: 1 }}>Save</Button>
              </div>
            </div>
          )}

          {(!profile?.savedAddresses?.length) && !addingAddr && (
            <p style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>No saved addresses yet.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profile?.savedAddresses?.map(addr => (
              <div key={addr._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'capitalize', marginBottom: 2 }}>{addr.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>{addr.address}</p>
                </div>
                <button onClick={() => removeAddress(addr._id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '4px 8px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--red)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text3)'}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
