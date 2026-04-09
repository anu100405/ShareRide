import { useState } from "react";
import {
  loginPassenger,
  loginDriver,
  registerPassenger,
  registerDriver,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Select } from "../shared/UI";

const VEHICLE_TYPES = ["bike", "auto", "mini", "sedan", "suv"].map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [role, setRole] = useState("passenger");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    licenseNumber: "",
    vehicleType: "sedan",
    vehicleModel: "",
    plateNumber: "",
    vehicleColor: "",
    capacity: 4,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      let res;
      if (mode === "login") {
        console.log("LOGIN");
        res =
          role === "passenger"
            ? await loginPassenger({
                email: form.email,
                password: form.password,
              })
            : await loginDriver({ email: form.email, password: form.password });
      } else {
        console.log("REGISTER");
        const payload =
          role === "passenger"
            ? {
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
              }
            : {
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                licenseNumber: form.licenseNumber,
                vehicle: {
                  type: form.vehicleType,
                  model: form.vehicleModel,
                  plateNumber: form.plateNumber,
                  color: form.vehicleColor,
                  capacity: Number(form.capacity),
                },
              };
        res =
          role === "passenger"
            ? await registerPassenger(payload)
            : await registerDriver(payload);
      }
      login(res.data.token, res.data.user);
      console.log(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          padding: 20,
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(240,192,64,0.08), transparent)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            animation: "fadeUp 0.4s ease",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 22 }}>🚕</span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: "-0.04em",
                }}
              >
                ShareRide
              </span>
            </div>
            <p style={{ color: "var(--text2)", marginTop: 8, fontSize: 14 }}>
              Fast rides, anywhere in the city
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 28,
            }}
          >
            {/* Mode Toggle */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 24,
                padding: 4,
                background: "var(--bg3)",
                borderRadius: 10,
              }}
            >
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 7,
                    border: "none",
                    background: mode === m ? "var(--accent)" : "transparent",
                    color: mode === m ? "#0a0a0f" : "var(--text2)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {/* Role Toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {["passenger", "driver"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: role === r ? "var(--accent)" : "var(--border)",
                    background:
                      role === r ? "var(--accent-glow)" : "transparent",
                    color: role === r ? "var(--accent)" : "var(--text2)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <span>{r === "passenger" ? "🧑" : "🚗"}</span>{" "}
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            {mode === "register" && (
              <Input
                label="Full Name"
                placeholder="Ravi Kumar"
                value={form.name}
                onChange={set("name")}
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
            />
            {mode === "register" && (
              <Input
                label="Phone"
                placeholder="9876543210"
                value={form.phone}
                onChange={set("phone")}
              />
            )}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
            />

            {mode === "register" && role === "driver" && (
              <>
                <div
                  style={{
                    height: 1,
                    background: "var(--border)",
                    margin: "8px 0 16px",
                  }}
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 12,
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                  }}
                >
                  Vehicle Info
                </p>
                <Input
                  label="License Number"
                  placeholder="DL-1234567890"
                  value={form.licenseNumber}
                  onChange={set("licenseNumber")}
                />
                <Select
                  label="Vehicle Type"
                  value={form.vehicleType}
                  onChange={set("vehicleType")}
                  options={VEHICLE_TYPES}
                />
                <Input
                  label="Model"
                  placeholder="Honda City"
                  value={form.vehicleModel}
                  onChange={set("vehicleModel")}
                />
                <Input
                  label="Plate Number"
                  placeholder="DL 01 AB 1234"
                  value={form.plateNumber}
                  onChange={set("plateNumber")}
                />
                <Input
                  label="Color"
                  placeholder="White"
                  value={form.vehicleColor}
                  onChange={set("vehicleColor")}
                />
                <Input
                  label="Capacity"
                  type="number"
                  placeholder="4"
                  value={form.capacity}
                  onChange={set("capacity")}
                />
              </>
            )}

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,79,79,0.08)",
                  border: "1px solid rgba(255,79,79,0.2)",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>
              </div>
            )}

            <Button
              loading={loading}
              onClick={submit}
              style={{ width: "100%", marginTop: 4 }}
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
