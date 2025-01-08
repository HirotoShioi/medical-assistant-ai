import { createBrowserRouter, redirect, RouterProvider } from "react-router";
import ErrorPage from "@/pages/error-page";
import Root from "@/routes/root";
import Providers from "@/providers/providers";
import NotFoundPage from "./pages/not-found-page";
import ChatPage from "./pages/chat/page";
import SettingsPage from "./pages/settings/page";
import IndexPage from "./pages/index/page";
import Callback, { loader as callbackLoader } from "./pages/callback";
import SignInPage from "./pages/sign-in";
import { fetchAuthSession } from "aws-amplify/auth";
import EditTemplatePage from "./pages/edit-template/page";
import AgentPage from "./pages/agent/page";
import PolicyPage from "./pages/policy/page";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AlertProvider } from "./components/alert";
import { Toaster } from "./components/ui/toaster";
import NewTemplatePage from "./pages/new-template/page";

async function redirectIfAuthenticated() {
  const session = await fetchAuthSession();
  if (session.credentials) {
    return redirect("/");
  }
  return null;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            path: "/",
            index: true,
            element: <IndexPage />,
          },
          {
            path: "/chat/:threadId",
            element: <ChatPage />,
          },
          {
            path: "/edit-template/:templateId",
            element: <EditTemplatePage />,
          },
          {
            path: "/template/new",
            element: <NewTemplatePage />,
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
          {
            path: "/sign-in",
            element: <SignInPage />,
            loader: redirectIfAuthenticated,
          },
          {
            path: "/callback",
            element: <Callback />,
            loader: callbackLoader,
          },
          {
            path: "/agent",
            element: <AgentPage />,
          },
          {
            path: "/not-found",
            element: <NotFoundPage />,
          },
          {
            path: "/policy",
            element: <PolicyPage />,
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <Providers>
      <TooltipProvider delayDuration={0}>
        <AlertProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AlertProvider>
      </TooltipProvider>
    </Providers>
  );
}
