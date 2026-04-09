import { useState, useEffect, useRef } from "react";
import {
  getDriverStatus,
  getCurrentRide,
  getEarnings,
} from "../../services/api";
import {
  emitGoOnline,
  emitGoOffline,
  emitUpdateLocation,
  emitAcceptRide,
  emitRejectRide,
  emitStartRide,
  emitCompleteRide,
  emitDriverCancelRide,
} from "../../services/socket";
import { useSocket } from "../../hooks/useSocket";
import {
  Button,
  Card,
  Badge,
  Spinner,
  Input,
  Modal,
  StatusDot,
  useToast,
  Toast,
} from "../shared/UI";

export default function DriverDashboard() {
  const { toast, show } = useToast();
  const [status, setStatus] = useState("offline");
  const [currentRide, setCurrentRide] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const locationRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    getDriverStatus()
      .then(({ data }) => setStatus(data.status || "offline"))
      .catch(() => {});
    getCurrentRide()
      .then(({ data }) => setCurrentRide(data.ride))
      .catch(() => {});
    getEarnings()
      .then(({ data }) => setEarnings(data.earnings))
      .catch(() => {});
  }, []);

  useSocket({
    "driver:status_updated": ({ status }) => setStatus(status),
    "ride:request_incoming": (data) => {
      setIncomingRide(data);
      setCountdown(20);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            setIncomingRide(null);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    },
    "ride:accepted": ({ ride, otp: rideOtp }) => {
      setCurrentRide(ride);
      setIncomingRide(null);
      clearInterval(countdownRef.current);
      show(`Ride accepted! OTP: ${rideOtp}`, "success");
    },
    "ride:started": () => {
      setCurrentRide((r) => (r ? { ...r, status: "in_progress" } : r));
      show("Ride started!", "info");
    },
    "ride:completed": (data) => {
      setCurrentRide((r) =>
        r ? { ...r, status: "completed", fare: data.fare } : r,
      );
      getEarnings()
        .then(({ data }) => setEarnings(data.earnings))
        .catch(() => {});
      show("Ride completed! 🎉", "success");
    },
    "ride:cancelled": ({ reason }) => {
      setCurrentRide(null);
      show(`Ride cancelled: ${reason}`, "error");
    },
    "ride:share_passenger_joined": ({ totalPassengers }) => {
      show(`New passenger joined! Total: ${totalPassengers}`, "info");
    },
  });

  const toggleOnline = async () => {
    setLoadingStatus(true);
    if (status === "offline") {
      emitGoOnline();
      locationRef.current = setInterval(() => {
        navigator.geolocation?.getCurrentPosition((pos) => {
          emitUpdateLocation(pos.coords.latitude, pos.coords.longitude);
          console.log(pos.coords.latitude, pos.coords.longitude);
        });
      }, 4000);
    } else {
      emitGoOffline();
      clearInterval(locationRef.current);
    }
    setTimeout(() => setLoadingStatus(false), 1000);
  };

  const acceptRide = () => {
    if (incomingRide?.rideId) emitAcceptRide(incomingRide.rideId);
    clearInterval(countdownRef.current);
    setIncomingRide(null);
  };

  const rejectRide = () => {
    if (incomingRide?.rideId) emitRejectRide(incomingRide.rideId);
    clearInterval(countdownRef.current);
    setIncomingRide(null);
  };

  const startRide = () => {
    if (currentRide?._id && otp) emitStartRide(currentRide._id, otp);
  };

  const completeRide = () => {
    if (currentRide?._id) emitCompleteRide(currentRide._id);
  };

  const cancelRide = () => {
    if (currentRide?._id)
      emitDriverCancelRide(currentRide._id, "Driver cancelled");
    setCurrentRide(null);
  };

  const isOnline = status === "online" || status === "on_ride";

  return (
    <div style={{ padding: 28, maxWidth: 720, animation: "fadeUp 0.3s ease" }}>
      {toast && <Toast {...toast} />}
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Driver Dashboard</h2>
      <p style={{ color: "var(--text2)", marginBottom: 28 }}>
        Manage your rides and availability
      </p>

      {/* Status + Earnings */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <Card
          style={{
            borderColor: isOnline ? "rgba(61,220,132,0.3)" : "var(--border)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Status
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <StatusDot status={status} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                textTransform: "capitalize",
              }}
            >
              {status.replace("_", " ")}
            </span>
          </div>
        </Card>
        <Card>
          <p
            style={{
              fontSize: 11,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Today
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--accent)",
            }}
          >
            ₹{earnings?.today || 0}
          </p>
        </Card>
        <Card>
          <p
            style={{
              fontSize: 11,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Rating
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            ⭐ {earnings?.rating || "—"}
          </p>
        </Card>
      </div>

      {/* Toggle Online */}
      <Card
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {isOnline ? "You are online" : "You are offline"}
          </p>
          <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 2 }}>
            {isOnline
              ? "Receiving ride requests from nearby passengers"
              : "Go online to start accepting rides"}
          </p>
        </div>
        <button
          onClick={toggleOnline}
          style={{
            width: 64,
            height: 34,
            borderRadius: 34,
            border: "none",
            background: isOnline ? "var(--green)" : "var(--surface2)",
            cursor: "pointer",
            transition: "background 0.3s",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 4,
              transition: "left 0.3s",
              left: isOnline ? 34 : 4,
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          />
        </button>
      </Card>

      {/* Incoming ride popup */}
      {incomingRide && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            width: 360,
            background: "var(--bg2)",
            border: "1px solid var(--accent)",
            borderRadius: "var(--radius)",
            padding: 20,
            animation: "fadeUp 0.3s ease",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                New Ride Request
              </p>
              <p style={{ fontSize: 12, color: "var(--text2)" }}>
                {incomingRide.rideType} · {incomingRide.vehicleType}
              </p>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background:
                  countdown < 8 ? "rgba(255,79,79,0.2)" : "var(--accent-glow)",
                border: `2px solid ${countdown < 8 ? "var(--red)" : "var(--accent)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
                color: countdown < 8 ? "var(--red)" : "var(--accent)",
              }}
            >
              {countdown}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 14,
              padding: "12px",
              background: "var(--surface)",
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--green)",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <p style={{ fontSize: 13, color: "var(--text2)" }}>
                {incomingRide.pickup?.address}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "var(--red)",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <p style={{ fontSize: 13, color: "var(--text2)" }}>
                {incomingRide.dropoff?.address}
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 22,
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  color: "var(--accent)",
                }}
              >
                ₹{incomingRide.fare?.estimated}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 16, fontWeight: 600 }}>
                {incomingRide.distance} km
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="danger" onClick={rejectRide} style={{ flex: 1 }}>
              Reject
            </Button>
            <Button onClick={acceptRide} style={{ flex: 2 }}>
              Accept ✓
            </Button>
          </div>
        </div>
      )}

      {/* Active ride */}
      {currentRide && (
        <Card style={{ borderColor: "rgba(240,192,64,0.3)" }}>
          <h4
            style={{
              marginBottom: 16,
              fontSize: 14,
              color: "var(--text2)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Active Ride
          </h4>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Badge
              variant={
                currentRide.status === "accepted"
                  ? "info"
                  : currentRide.status === "in_progress"
                    ? "warning"
                    : currentRide.status === "completed"
                      ? "success"
                      : "default"
              }
            >
              {currentRide.status?.replace("_", " ")}
            </Badge>
            <span
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              ₹{currentRide.fare?.estimated}
            </span>
          </div>

          {/* Passenger info */}
          <div
            style={{
              padding: 12,
              background: "var(--bg3)",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>
              Passenger
            </p>
            <p style={{ fontWeight: 600 }}>{currentRide.passenger?.name}</p>
            <p style={{ fontSize: 12, color: "var(--text2)" }}>
              {currentRide.passenger?.phone}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--green)",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <p style={{ fontSize: 13, color: "var(--text2)" }}>
                {currentRide.pickup?.address}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "var(--red)",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <p style={{ fontSize: 13, color: "var(--text2)" }}>
                {currentRide.dropoff?.address}
              </p>
            </div>
          </div>

          {currentRide.status === "accepted" && (
            <div style={{ marginBottom: 12 }}>
              <Input
                label="Enter OTP from passenger"
                placeholder="4821"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <Button
                  variant="danger"
                  onClick={cancelRide}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button onClick={startRide} style={{ flex: 2 }} disabled={!otp}>
                  Start Ride →
                </Button>
              </div>
            </div>
          )}

          {currentRide.status === "in_progress" && (
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="danger" onClick={cancelRide} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button onClick={completeRide} style={{ flex: 2 }}>
                Complete Ride ✓
              </Button>
            </div>
          )}

          {currentRide.status === "completed" && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <p style={{ color: "var(--green)", fontWeight: 600 }}>
                ✅ Ride completed! Fare: ₹
                {currentRide.fare?.actual || currentRide.fare?.estimated}
              </p>
              <Button
                variant="ghost"
                onClick={() => setCurrentRide(null)}
                style={{ marginTop: 10 }}
              >
                Dismiss
              </Button>
            </div>
          )}
        </Card>
      )}

      {!currentRide && isOnline && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "var(--green)",
                animation: "pulse 1.5s infinite",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                color: "var(--green)",
              }}
            >
              Waiting for ride requests...
            </p>
          </div>
          <p style={{ color: "var(--text3)", fontSize: 13 }}>
            Requests will appear as a popup notification
          </p>
        </Card>
      )}
    </div>
  );
}
