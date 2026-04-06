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

export const router = createBrowserRouter([
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
    path: "/discover",
    Component: Discovery,
  },
  {
    path: "/matches",
    Component: Matches,
  },
  {
    path: "/messages",
    Component: Messages,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/design-system",
    Component: DesignSystem,
  },
  {
    path: "/onboarding/profile",
    Component: OnboardingProfile,
  },
]);
