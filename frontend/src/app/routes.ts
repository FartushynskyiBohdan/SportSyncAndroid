import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Discovery } from "./pages/Discover";
import { Matches } from "./pages/Matches";
import { Messages } from "./pages/Messages";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { SettingsDeleteAccount } from "./pages/SettingsDeleteAccount";
import { SettingsPassword } from "./pages/SettingsPassword";
import { BlockedUsers } from "./pages/BlockedUsers";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { DesignSystem } from "./pages/DesignSystem";
import { OnboardingProfile } from "./pages/onboarding/OnboardingProfile";
import { OnboardingSports } from "./pages/onboarding/OnboardingSports";
import { OnboardingPhotos } from "./pages/onboarding/OnboardingPhotos";
import { OnboardingBio } from "./pages/onboarding/OnboardingBio";
import { OnboardingPreferences } from "./pages/onboarding/OnboardingPreferences";
import { OnboardingComplete } from "./pages/onboarding/OnboardingComplete";
import { ProtectedRoute, AppRoute, AdminRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminHome } from "./pages/admin/AdminHome";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminReports } from "./pages/admin/AdminReports";

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
    path: "/design-system",
    Component: DesignSystem,
  },

  // Auth required — onboarding pages
  {
    Component: ProtectedRoute,
    children: [
      { path: "/onboarding/profile", Component: OnboardingProfile },
      { path: "/onboarding/sports", Component: OnboardingSports },
      { path: "/onboarding/photos", Component: OnboardingPhotos },
      { path: "/onboarding/bio", Component: OnboardingBio },
      { path: "/onboarding/preferences", Component: OnboardingPreferences },
      { path: "/onboarding/complete", Component: OnboardingComplete },
    ],
  },

  // Auth + onboarding complete required — main app pages
  {
    Component: AppRoute,
    children: [
      { path: "/discover", Component: Discovery },
      { path: "/matches", Component: Matches },
      { path: "/messages", Component: Messages },
      { path: "/profile", Component: Profile },
      { path: "/profile/:userId", Component: Profile },
      { path: "/settings", Component: Settings },
      { path: "/settings/password", Component: SettingsPassword },
      { path: "/settings/delete-account", Component: SettingsDeleteAccount },
      { path: "/settings/blocked-users", Component: BlockedUsers },
    ],
  },

  // Admin routes
  {
    Component: AdminRoute,
    children: [
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminHome },
          { path: "home", Component: AdminHome },
          { path: "users", Component: AdminUsers },
          { path: "reports", Component: AdminReports },
        ],
      },
    ],
  },
]);
