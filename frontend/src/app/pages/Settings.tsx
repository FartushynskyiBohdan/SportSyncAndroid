import { useEffect, useState } from "react";
import {
  Loader2,
  Lock,
  Save,
  User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import api, { isAxiosError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { SettingsPanel, SettingsShell } from "../components/settings/SettingsShell";

import isEmail from 'validator/lib/isEmail';

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
  email: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  gender_id: number | null;
  city_id: number | null;
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
  const { user, updateUser } = useAuth();

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
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [unlockMessage, setUnlockMessage] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

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
      setVerifiedPassword(unlockPassword.trim());
      setUnlockPassword("");
      setAccountUnlocked(true);
      setUnlockMessage("Verified. You can now update the editable account fields below.");
    } catch (error) {
      setAccountUnlocked(false);
      setVerifiedPassword("");
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

    if (!verifiedPassword.trim()) {
      setAccountError("Your current password is required to save account changes.");
      return;
    }

    if (!isEmail(form.email.trim())) {
      setAccountError("A valid email address is required.");
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
        current_password: verifiedPassword,
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
      setVerifiedPassword("");
      setUnlockPassword("");
      setAccountUnlocked(false);
      setUnlockMessage("Changes saved. Re-enter your password to unlock editable fields again.");
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

  return (
    <SettingsShell>
      {loadingPage ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
          <div className="flex items-center gap-3 text-white/70">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading settings...
          </div>
        </div>
      ) : (
        <SettingsPanel
          icon={<User className="h-5 w-5 text-white" />}
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
                disabled={accountUnlocked}
                className="h-11 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/35"
              />
              <Button
                onClick={handleUnlock}
                disabled={accountUnlocked}
                className="h-11 rounded-2xl bg-white text-purple-950 hover:bg-purple-100"
              >
                {accountUnlocked ? "Verified" : "Unlock fields"}
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
                disabled
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
                disabled
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
                disabled
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
                disabled
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
        </SettingsPanel>
      )}
    </SettingsShell>
  );
}
