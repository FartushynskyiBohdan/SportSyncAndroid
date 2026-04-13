import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  ChevronLeft,
  Lock,
  LogOut,
  type LucideIcon,
  Settings as SettingsIcon,
  Shield,
  User,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { useAuth } from "../context/AuthContext";

function Panel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-xl shadow-black/10">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-black/10 px-4 py-4">
      <div className="max-w-xl">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/55">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20"
      />
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [accountUnlocked, setAccountUnlocked] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState("");
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  const handleUnlock = () => {
    if (!passwordInput.trim()) {
      setPasswordPrompt("Enter your current password before unlocking account fields.");
      setAccountUnlocked(false);
      return;
    }

    setPasswordPrompt(
      "Fields unlocked locally. Backend verification and persistence are not wired yet."
    );
    setAccountUnlocked(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
        <button
          onClick={() => navigate(-1)}
          className="group mb-6 flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <SettingsIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-5xl">Settings</h1>
                <p className="mt-1 text-sm text-white/60">
                  Account access, notification preferences, and privacy controls.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-md rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Profile details in the database live across `users` and `profiles`. This page now avoids fake saved edits until the backend endpoints exist.
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
          <div className="space-y-6">
            <Panel
              icon={User}
              title="Account"
              description="Sensitive details stay locked until the current password is entered."
            >
              <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 text-white/70" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">Account verification</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/55">
                      Email comes from the authenticated user record. Name and city belong to the profile record, so we should not expose editable fields casually.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordInput}
                    onChange={(event) => setPasswordInput(event.target.value)}
                    placeholder="Enter current password"
                    className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                  />
                  <Button
                    onClick={handleUnlock}
                    className="h-11 rounded-2xl bg-white text-purple-950 hover:bg-purple-100"
                  >
                    Unlock fields
                  </Button>
                </div>

                {passwordPrompt && (
                  <p className="mt-3 text-sm text-white/60">{passwordPrompt}</p>
                )}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-white/70">
                    Display name
                  </label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    disabled={!accountUnlocked}
                    placeholder={accountUnlocked ? "Enter display name" : "Locked"}
                    className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="mb-2 block text-sm font-medium text-white/70">
                    Home city
                  </label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    disabled={!accountUnlocked}
                    placeholder={accountUnlocked ? "Enter home city" : "Locked"}
                    className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/70">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!accountUnlocked}
                  placeholder={accountUnlocked ? "Enter email address" : "Locked"}
                  className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-white">Persistence status</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">
                  We have schema support for `users.email` and profile fields in `profiles`, but there is no account update endpoint yet, so edits here are intentionally not saved.
                </p>
              </div>
            </Panel>

            <Panel
              icon={Shield}
              title="Privacy"
              description="Small messaging-related controls that make sense for the current product scope."
            >
              <div className="space-y-3">
                <SettingRow
                  title="Read receipts"
                  description="Control whether people can see when you have read their latest message."
                  checked={readReceipts}
                  onCheckedChange={setReadReceipts}
                />
              </div>

              <Separator className="my-5 bg-white/10" />

              <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                <h3 className="text-sm font-semibold text-white">Product scope note</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/60">
                  Discovery filtering already lives on the discovery page, so it has been removed from settings to avoid duplicating controls.
                </p>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              icon={Bell}
              title="Notifications"
              description="Only the notification types that exist in the current schema are represented here."
            >
              <div className="space-y-3">
                <SettingRow
                  title="New match alerts"
                  description="Receive alerts when a mutual match is created."
                  checked={matchAlerts}
                  onCheckedChange={setMatchAlerts}
                />
                <SettingRow
                  title="Message notifications"
                  description="Receive alerts when a new message arrives in an existing match."
                  checked={messageAlerts}
                  onCheckedChange={setMessageAlerts}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-white">Persistence status</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">
                  The schema supports notifications themselves, but not user-managed notification preference storage yet, so these toggles are UI-only for now.
                </p>
              </div>
            </Panel>

            <section className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white">Sign out</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                End your current session on this device.
              </p>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="mt-4 rounded-2xl border-rose-300/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
