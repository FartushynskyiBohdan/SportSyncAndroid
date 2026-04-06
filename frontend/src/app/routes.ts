import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Discovery } from "./pages/Discover";
import { Matches } from "./pages/Matches";
import { Messages } from "./pages/Messages";
import { Profile } from "./pages/Profile";
import { DesignSystem } from "./pages/DesignSystem";
import { OnboardingProfile } from "./pages/onboarding/OnboardingProfile";
import { OnboardingSports } from "./pages/onboarding/OnboardingSports";
import { OnboardingPhotos } from "./pages/onboarding/OnboardingPhotos";
import { OnboardingBio } from "./pages/onboarding/OnboardingBio";
import { OnboardingPreferences } from "./pages/onboarding/OnboardingPreferences";
import { OnboardingComplete } from "./pages/onboarding/OnboardingComplete";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
    path: "/design-system",
    Component: DesignSystem,
  },

  // Protected routes
  {
    Component: ProtectedRoute,
    children: [
      { path: "/discover", Component: Discovery },
      { path: "/matches", Component: Matches },
      { path: "/messages", Component: Messages },
      { path: "/profile", Component: Profile },
      { path: "/onboarding/profile", Component: OnboardingProfile },
      { path: "/onboarding/sports", Component: OnboardingSports },
      { path: "/onboarding/photos", Component: OnboardingPhotos },
      { path: "/onboarding/bio", Component: OnboardingBio },
      { path: "/onboarding/preferences", Component: OnboardingPreferences },
      { path: "/onboarding/complete", Component: OnboardingComplete },
    ],
  },
]);
