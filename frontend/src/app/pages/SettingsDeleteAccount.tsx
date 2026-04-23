import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import api, { isAxiosError } from "../lib/api";
import { SettingsPanel, SettingsShell } from "../components/settings/SettingsShell";
import { useAuth } from "../context/AuthContext";

export function SettingsDeleteAccount() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    setError("");

    if (!currentPassword.trim()) {
      setError("Enter your current password before deleting your account.");
      return;
    }

    if (confirmation !== "DELETE") {
      setError('Type DELETE exactly to confirm account deletion.');
      return;
    }

    setDeleting(true);
    try {
      await api.delete("/api/settings/account", {
        data: {
          current_password: currentPassword,
          confirmation,
        },
      });

      logout();
      navigate("/signup", { replace: true });
    } catch (error) {
      if (isAxiosError(error)) {
        setError(error.response?.data?.error ?? "Failed to delete account.");
      } else {
        setError("Failed to delete account.");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SettingsShell>
      <SettingsPanel
        icon={<AlertTriangle className="h-5 w-5 text-white" />}
        title="Delete account"
        description="This permanently removes your account and related activity from the current schema."
      >
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
          <h3 className="text-sm font-semibold text-white">This action cannot be undone</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Your profile, photos, likes, passes, matches, messages, notifications, complaints, and preference records will be deleted.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="deletePassword" className="mb-2 block text-sm font-medium text-white/70">
              Current password
            </label>
            <Input
              id="deletePassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="h-11 rounded-2xl border-white/15 bg-white/10 text-white"
            />
          </div>

          <div>
            <label htmlFor="deleteConfirmation" className="mb-2 block text-sm font-medium text-white/70">
              Type DELETE to confirm
            </label>
            <Input
              id="deleteConfirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="h-11 rounded-2xl border-white/15 bg-white/10 text-white"
            />
          </div>
        </div>

        {error && <p className="mt-5 text-sm text-rose-300">{error}</p>}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-2xl bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Delete account
          </Button>
        </div>
      </SettingsPanel>
    </SettingsShell>
  );
}
