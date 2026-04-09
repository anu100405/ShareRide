import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./components/auth/AuthPage";
import Sidebar from "./components/shared/Sidebar";
import { Spinner, Toast, useToast } from "./components/shared/UI";

// Passenger pages
import BookRide from "./components/passenger/BookRide";
import PassengerRideHistory from "./components/passenger/RideHistory";
import SharedRides from "./components/passenger/SharedRides";
import NearbyDrivers from "./components/passenger/NearbyDrivers";

// Driver pages
import DriverDashboard from "./components/driver/DriverDashboard";
import DriverRideHistory from "./components/driver/DriverRideHistory";
import DriverEarnings from "./components/driver/DriverEarnings";

// Shared pages
import Profile from "./components/shared/Profile";
import FareGuide from "./components/shared/FareGuide";

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("__init__");

  const defaultPage = user?.role === "driver" ? "dashboard" : "book";
  const activePage = page === "__init__" ? defaultPage : page;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚕</div>
          <Spinner size={32} />
          <p style={{ marginTop: 16, color: "var(--text3)", fontSize: 14 }}>
            Loading ShareRide...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const renderPage = () => {
    if (user.role === "passenger") {
      switch (activePage) {
        case "book":
          return <BookRide />;
        case "rides":
          return <PassengerRideHistory />;
        case "shared":
          return <SharedRides />;
        case "nearby":
          return <NearbyDrivers />;
        case "fares":
          return <FareGuide />;
        case "profile":
          return <Profile />;
        default:
          return <BookRide />;
      }
    } else {
      switch (activePage) {
        case "dashboard":
          return <DriverDashboard />;
        case "rides":
          return <DriverRideHistory />;
        case "earnings":
          return <DriverEarnings />;
        case "fares":
          return <FareGuide />;
        case "profile":
          return <Profile />;
        default:
          return <DriverDashboard />;
      }
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar active={activePage} onNav={setPage} />
      <main style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
