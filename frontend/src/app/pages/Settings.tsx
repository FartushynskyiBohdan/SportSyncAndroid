import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Loader2,
  Lock,
  LogOut,
  type LucideIcon,
  Save,
  Settings as SettingsIcon,
  Shield,
  User,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import api, { isAxiosError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Gender {
  id: number;
  name: string;
}

interface Country {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface AccountResponse {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  gender_id: number | null;
  city_id: number | null;
  city_name: string | null;
  country_id: number | null;
}

interface AccountFormState {
  email: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender_id: string;
  country_id: string;
  city_id: string;
}

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

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: number; name: string }>;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white/70">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" className="bg-[#2E1065] text-white/60">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.id} value={String(option.id)} className="bg-[#2E1065] text-white">
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [form, setForm] = useState<AccountFormState>({
    email: user?.email ?? "",
    first_name: "",
    last_name: "",
    birth_date: "",
    gender_id: "",
    country_id: "",
    city_id: "",
  });
  const [genders, setGenders] = useState<Gender[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [accountUnlocked, setAccountUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockMessage, setUnlockMessage] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      setLoadingPage(true);

      try {
        const [accountRes, gendersRes, countriesRes] = await Promise.all([
          api.get<AccountResponse>("/api/settings/account"),
          api.get<Gender[]>("/api/genders"),
          api.get<Country[]>("/api/countries"),
        ]);

        if (!mounted) return;

        const account = accountRes.data;
        setGenders(gendersRes.data);
        setCountries(countriesRes.data);
        setForm({
          email: account.email ?? "",
          first_name: account.first_name ?? "",
          last_name: account.last_name ?? "",
          birth_date: account.birth_date ? String(account.birth_date).split("T")[0] : "",
          gender_id: account.gender_id ? String(account.gender_id) : "",
          country_id: account.country_id ? String(account.country_id) : "",
          city_id: account.city_id ? String(account.city_id) : "",
        });
      } catch (error) {
        if (!mounted) return;
        setAccountError("Failed to load account settings.");
      } finally {
        if (mounted) {
          setLoadingPage(false);
        }
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!form.country_id) {
      setCities([]);
      setForm((prev) => ({ ...prev, city_id: "" }));
      return;
    }

    let mounted = true;
    setLoadingCities(true);

    api
      .get<City[]>(`/api/countries/${form.country_id}/cities`)
      .then((response) => {
        if (!mounted) return;
        setCities(response.data);
        setForm((prev) => {
          const hasCurrentCity = response.data.some((city) => String(city.id) === prev.city_id);
          return hasCurrentCity ? prev : { ...prev, city_id: "" };
        });
      })
      .catch(() => {
        if (mounted) {
          setCities([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingCities(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [form.country_id]);

  const setField = <K extends keyof AccountFormState,>(key: K, value: AccountFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUnlock = async () => {
    setUnlockError("");
    setUnlockMessage("");

    if (!unlockPassword.trim()) {
      setUnlockError("Enter your current password before unlocking account fields.");
      return;
    }

    try {
      await api.post("/api/settings/verify-password", {
        current_password: unlockPassword,
      });
      setAccountUnlocked(true);
      setUnlockMessage("Account fields unlocked.");
    } catch (error) {
      setAccountUnlocked(false);
      if (isAxiosError(error)) {
        setUnlockError(error.response?.data?.error ?? "Failed to verify password.");
      } else {
        setUnlockError("Failed to verify password.");
      }
    }
  };

  const handleSaveAccount = async () => {
    setAccountError("");
    setAccountMessage("");

    if (!unlockPassword.trim()) {
      setAccountError("Your current password is required to save account changes.");
      return;
    }

    if (
      !form.email.trim() ||
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.birth_date ||
      !form.gender_id ||
      !form.country_id ||
      !form.city_id
    ) {
      setAccountError("Complete all account fields before saving.");
      return;
    }

    setSavingAccount(true);
    try {
      const response = await api.put("/api/settings/account", {
        current_password: unlockPassword,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        birth_date: form.birth_date,
        gender_id: Number(form.gender_id),
        city_id: Number(form.city_id),
      });

      if (user) {
        updateUser({ ...user, email: response.data.user.email });
      }

      setAccountMessage(response.data.message ?? "Account updated successfully.");
    } catch (error) {
      if (isAxiosError(error)) {
        setAccountError(error.response?.data?.error ?? "Failed to update account.");
      } else {
        setAccountError("Failed to update account.");
      }
    } finally {
      setSavingAccount(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (
      !passwordForm.current_password.trim() ||
      !passwordForm.new_password.trim() ||
      !passwordForm.confirm_password.trim()
    ) {
      setPasswordError("Complete all password fields before saving.");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.put("/api/settings/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMessage(response.data.message ?? "Password updated successfully.");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      if (isAxiosError(error)) {
        setPasswordError(error.response?.data?.error ?? "Failed to update password.");
      } else {
        setPasswordError("Failed to update password.");
      }
    } finally {
      setChangingPassword(false);
    }
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
                  Manage account information and password using the real backend schema.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            Account updates write to `users.email` plus the linked `profiles` record for name, birth date, gender, and city.
          </div>
        </div>

        {loadingPage ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading settings...
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
            <div className="space-y-6">
              <Panel
                icon={User}
                title="Account"
                description="Editing profile basics requires current-password verification before the fields unlock."
              >
                <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-4 w-4 text-white/70" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white">Unlock account fields</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/55">
                        This checks your current password before allowing edits to email and profile basics.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <Input
                      id="unlockPassword"
                      type="password"
                      value={unlockPassword}
                      onChange={(event) => setUnlockPassword(event.target.value)}
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

                  {unlockMessage && <p className="mt-3 text-sm text-emerald-200">{unlockMessage}</p>}
                  {unlockError && <p className="mt-3 text-sm text-rose-300">{unlockError}</p>}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-white/70">
                      First name
                    </label>
                    <Input
                      id="firstName"
                      value={form.first_name}
                      onChange={(event) => setField("first_name", event.target.value)}
                      disabled={!accountUnlocked}
                      className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-white/70">
                      Last name
                    </label>
                    <Input
                      id="lastName"
                      value={form.last_name}
                      onChange={(event) => setField("last_name", event.target.value)}
                      disabled={!accountUnlocked}
                      className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/70">
                      Email address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setField("email", event.target.value)}
                      disabled={!accountUnlocked}
                      className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
                    />
                  </div>
                  <div>
                    <label htmlFor="birthDate" className="mb-2 block text-sm font-medium text-white/70">
                      Date of birth
                    </label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={form.birth_date}
                      onChange={(event) => setField("birth_date", event.target.value)}
                      disabled={!accountUnlocked}
                      className="h-11 rounded-2xl border-white/15 bg-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <SelectField
                    id="gender"
                    label="Gender"
                    value={form.gender_id}
                    onChange={(value) => setField("gender_id", value)}
                    options={genders}
                    disabled={!accountUnlocked}
                    placeholder="Select gender"
                  />
                  <SelectField
                    id="country"
                    label="Country"
                    value={form.country_id}
                    onChange={(value) => setField("country_id", value)}
                    options={countries}
                    disabled={!accountUnlocked}
                    placeholder="Select country"
                  />
                  <SelectField
                    id="city"
                    label="City"
                    value={form.city_id}
                    onChange={(value) => setField("city_id", value)}
                    options={cities}
                    disabled={!accountUnlocked || loadingCities || !form.country_id}
                    placeholder={loadingCities ? "Loading cities..." : "Select city"}
                  />
                </div>

                {accountMessage && <p className="mt-5 text-sm text-emerald-200">{accountMessage}</p>}
                {accountError && <p className="mt-5 text-sm text-rose-300">{accountError}</p>}

                <div className="mt-5 flex justify-end">
                  <Button
                    onClick={handleSaveAccount}
                    disabled={!accountUnlocked || savingAccount}
                    className="rounded-2xl bg-white text-purple-950 hover:bg-purple-100 disabled:opacity-50"
                  >
                    {savingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save account
                  </Button>
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel
                icon={Shield}
                title="Password"
                description="Change your password directly against the authenticated user record."
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPasswordChange" className="mb-2 block text-sm font-medium text-white/70">
                      Current password
                    </label>
                    <Input
                      id="currentPasswordChange"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))
                      }
                      className="h-11 rounded-2xl border-white/15 bg-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-white/70">
                      New password
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))
                      }
                      className="h-11 rounded-2xl border-white/15 bg-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-white/70">
                      Confirm new password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))
                      }
                      className="h-11 rounded-2xl border-white/15 bg-white/10 text-white"
                    />
                  </div>
                </div>

                {passwordMessage && <p className="mt-5 text-sm text-emerald-200">{passwordMessage}</p>}
                {passwordError && <p className="mt-5 text-sm text-rose-300">{passwordError}</p>}

                <div className="mt-5 flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="rounded-2xl bg-white text-purple-950 hover:bg-purple-100 disabled:opacity-50"
                  >
                    {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    Change password
                  </Button>
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
        )}
      </div>
    </div>
  );
}
