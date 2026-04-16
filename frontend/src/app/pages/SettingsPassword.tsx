import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import api, { isAxiosError } from "../lib/api";
import { SettingsPanel, SettingsShell } from "../components/settings/SettingsShell";

export function SettingsPassword() {
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  return (
    <SettingsShell note="Password updates write back to `users.password_hash` after verifying the current password.">
      <SettingsPanel
        icon={<Shield className="h-5 w-5 text-white" />}
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
      </SettingsPanel>
    </SettingsShell>
  );
}
