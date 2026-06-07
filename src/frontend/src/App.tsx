import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { AdminPage } from "./pages/AdminPage";
import { CalendarPage } from "./pages/CalendarPage";
import { HomePage } from "./pages/HomePage";

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  ),
});

// Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: CalendarPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

// Catch-all redirect
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  calendarRoute,
  adminRoute,
  catchAllRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
