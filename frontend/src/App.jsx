import { useEffect, useState } from "react";
import { ClipboardList, Dumbbell } from "lucide-react";
import { api } from "./api";
import { c, radius } from "./theme";
import { useMediaQuery } from "./hooks/useMediaQuery";
import GlobalStyle from "./components/GlobalStyle";
import LibraryScreen from "./components/LibraryScreen";
import Logo from "./components/Logo";
import LogScreen from "./components/LogScreen";
import ProfileScreen from "./components/ProfileScreen";

const NAV_TABS = [
  { key: "log", label: "Log", icon: Dumbbell },
  { key: "library", label: "Library", icon: ClipboardList },
];

// Persisted the same way HealthHub persists its theme choice and food-tracker
// persists its active tab: iOS can fully reload this page after backgrounding
// it, and restoring which tab was open is what makes that reload unnoticeable
// instead of jarring.
function readStoredTab() {
  try {
    const t = localStorage.getItem("wio-tab");
    return NAV_TABS.some((n) => n.key === t) ? t : "log";
  } catch {
    return "log";
  }
}

export default function App() {
  const [screen, setScreen] = useState("profile");
  const [tab, setTabState] = useState(readStoredTab);
  const isDesktop = useMediaQuery("(min-width: 860px)");
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [profilesError, setProfilesError] = useState(null);

  function setTab(next) {
    setTabState(next);
    try {
      localStorage.setItem("wio-tab", next);
    } catch {
      /* noop */
    }
  }

  const refreshProfiles = () =>
    api
      .getProfiles()
      .then((p) => {
        setProfiles(p);
        setProfilesError(null);
      })
      .catch((e) => setProfilesError(e.message));

  useEffect(() => {
    refreshProfiles();
  }, []);

  const addProfile = async (name) => {
    await api.createProfile(name);
    refreshProfiles();
  };

  if (screen === "profile") {
    return (
      <>
        <GlobalStyle />
        <ProfileScreen
          profiles={profiles}
          profilesError={profilesError}
          onSelect={(p) => {
            setProfile(p);
            setScreen("app");
          }}
          onAddProfile={addProfile}
        />
      </>
    );
  }

  const topNav = (
    <div className="wio-nav">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Logo size={26} />
          <span className="wio-wordmark" style={{ fontSize: 11, color: c.ink }}>Work it out</span>
        </div>
      </div>

      {isDesktop && (
        <div className="wio-tabs">
          <button className="wio-tab-btn" onClick={() => setTab("log")} style={{ background: tab === "log" ? c.primary : "transparent", color: tab === "log" ? "#fff" : c.slate }}>
            Log
          </button>
          <button className="wio-tab-btn" onClick={() => setTab("library")} style={{ background: tab === "library" ? c.primary : "transparent", color: tab === "library" ? "#fff" : c.slate }}>
            Library
          </button>
        </div>
      )}

      <button
        onClick={() => setScreen("profile")}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer" }}
      >
        <div style={{ width: 28, height: 28, borderRadius: radius.sm, background: c.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#fff" }}>
          {profile?.name?.[0]}
        </div>
        <span style={{ fontSize: 12, color: c.slate }}>Switch</span>
      </button>
    </div>
  );

  const mainContent = (
    <div className="wio-main">
      <div className="wio-content-grid">
        {tab === "log" ? <LogScreen profile={profile} /> : <LibraryScreen />}
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="wio-mobile-shell" style={{ background: c.softStone }}>
        <GlobalStyle />
        {topNav}
        <div className="wio-mobile-content">{mainContent}</div>
        <nav className="wio-bottom-nav">
          {NAV_TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                className="wio-bottom-nav-btn"
                onClick={() => setTab(key)}
                style={{ color: active ? c.primary : c.slate, fontWeight: active ? 600 : 400 }}
              >
                <Icon size={19} />
                <span style={{ fontSize: 10 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="wio-shell" style={{ background: c.softStone, minHeight: "100vh" }}>
      <GlobalStyle />
      {topNav}
      {mainContent}
    </div>
  );
}
