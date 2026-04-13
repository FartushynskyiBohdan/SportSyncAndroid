import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  ChevronLeft,
  Lock,
  LogOut,
  type LucideIcon,
  Save,
  Settings as SettingsIcon,
  Shield,
  SlidersHorizontal,
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
  const { user, updateUser, logout } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [displayName, setDisplayName] = useState("Nathan");
  const [city, setCity] = useState("Dublin");
  const [distance, setDistance] = useState("25 km");
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [trainingReminders, setTrainingReminders] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;

    const timeout = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  const handleSave = () => {
    if (user) {
      updateUser({ ...user, email });
    }
    setSaved(true);
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
                  Tune your account, discovery preferences, and notifications.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {saved && (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200">
                Changes saved
              </span>
            )}
            <Button
              onClick={handleSave}
              className="rounded-2xl bg-white text-purple-950 hover:bg-purple-100"
            >
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-6">
            <Panel
              icon={User}
              title="Account"
              description="Keep the essentials current so matches know who they are meeting."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-white/70">
                    Display name
                  </label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
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
                  className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Edit profile
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Manage photos
                </Button>
              </div>
            </Panel>

            <Panel
              icon={SlidersHorizontal}
              title="Discovery"
              description="Decide how visible you are and how selective your athlete feed should feel."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="distance" className="mb-2 block text-sm font-medium text-white/70">
                    Max distance
                  </label>
                  <Input
                    id="distance"
                    value={distance}
                    onChange={(event) => setDistance(event.target.value)}
                    className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-4">
                  <p className="text-sm font-semibold text-white">Profile visibility</p>
                  <p className="mt-1 text-sm text-white/55">
                    {profileVisible
                      ? "Your profile is visible in discovery."
                      : "Your profile is paused and hidden from discovery."}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <SettingRow
                  title="Visible in discovery"
                  description="Pause swiping while you focus on training, travel, or recovery."
                  checked={profileVisible}
                  onCheckedChange={setProfileVisible}
                />
                <SettingRow
                  title="Show distance on profile"
                  description="Display how far away you are to help coordinate workouts and dates."
                  checked={showDistance}
                  onCheckedChange={setShowDistance}
                />
                <SettingRow
                  title="Prioritize verified athletes"
                  description="Lean your feed toward people with completed profiles and verified activity."
                  checked={verifiedOnly}
                  onCheckedChange={setVerifiedOnly}
                />
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              icon={Bell}
              title="Notifications"
              description="Keep the important stuff loud and the rest calm."
            >
              <div className="space-y-3">
                <SettingRow
                  title="New match alerts"
                  description="Get notified as soon as another athlete matches with you."
                  checked={matchAlerts}
                  onCheckedChange={setMatchAlerts}
                />
                <SettingRow
                  title="Message notifications"
                  description="Stay on top of conversations and incoming training invites."
                  checked={messageAlerts}
                  onCheckedChange={setMessageAlerts}
                />
                <SettingRow
                  title="Training reminders"
                  description="Receive nudges for planned sessions, races, and meetups."
                  checked={trainingReminders}
                  onCheckedChange={setTrainingReminders}
                />
                <SettingRow
                  title="Weekly email digest"
                  description="See a recap of matches, likes, and profile activity."
                  checked={emailDigest}
                  onCheckedChange={setEmailDigest}
                />
              </div>
            </Panel>

            <Panel
              icon={Shield}
              title="Privacy and safety"
              description="A few controls for how your activity and conversations are shared."
            >
              <div className="space-y-3">
                <SettingRow
                  title="Read receipts"
                  description="Let people know when you have seen their latest message."
                  checked={readReceipts}
                  onCheckedChange={setReadReceipts}
                />
                <SettingRow
                  title="Secure mode"
                  description="Require verified profiles before new conversations can start."
                  checked={verifiedOnly}
                  onCheckedChange={setVerifiedOnly}
                />
              </div>

              <Separator className="my-5 bg-white/10" />

              <div className="rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 text-amber-300" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Password and access</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">
                      Password reset, device history, and login approvals can live here once the backend is connected.
                    </p>
                  </div>
                </div>
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
