import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import type { Locale } from "./lib/i18n";
import { loadSession, checkAuth, apiLogout, type FarmerProfile } from "./lib/auth";

function Router({
  locale,
  setLocale,
  profile,
  onLogin,
  onLogout,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  profile: FarmerProfile | null;
  onLogin: (newProfile?: FarmerProfile) => void;
  onLogout: () => void;
}) {
  const [location, setLocation] = useLocation();

  return (
    <Switch>
      <Route path="/">
        {() =>
          profile ? (
            <Home
              locale={locale}
              setLocale={setLocale}
              profile={profile}
              onLogout={onLogout}
              onGoAdmin={() => setLocation("/admin")}
            />
          ) : (
            <Login locale={locale} setLocale={setLocale} onLogin={onLogin} />
          )
        }
      </Route>
      <Route path="/login">
        {() => <Login locale={locale} setLocale={setLocale} onLogin={onLogin} />}
      </Route>
      <Route path="/admin">
        {() =>
          profile && profile.role === "admin" ? (
            <Admin
              locale={locale}
              profile={profile}
              onLogout={onLogout}
              onBackToFarmer={() => setLocation("/")}
            />
          ) : (
            <Login locale={locale} setLocale={setLocale} onLogin={onLogin} />
          )
        }
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = window.localStorage.getItem("kisan-saathi-locale");
    return saved === "hi" || saved === "mr" ? saved : "en";
  });
  const [profile, setProfile] = useState<FarmerProfile | null>(() => loadSession());

  useEffect(() => {
    window.localStorage.setItem("kisan-saathi-locale", locale);
    document.documentElement.lang = locale === "hi" ? "hi" : locale === "mr" ? "mr" : "en";
  }, [locale]);

  // Check backend session on mount
  useEffect(() => {
    checkAuth().then((backendProfile) => {
      if (backendProfile) {
        setProfile(backendProfile);
      }
    });
  }, []);

  const handleLogin = (newProfile?: FarmerProfile) => {
    if (newProfile) {
      setProfile(newProfile);
    } else {
      checkAuth().then((p) => setProfile(p || loadSession()));
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    setProfile(null);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router
            locale={locale}
            setLocale={setLocale}
            profile={profile}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
