import { Routes, Route } from "react-router-dom";

import AuthLayout from "./components/layouts/AuthLayout";

import Tests from "./pages/Tests";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Apikey from "./pages/Apikey";
import Account from "./pages/Account";
import SessionDetails from "./pages/session/RunDetails";
import Shared from "./pages/Shared";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ProjectSettings from "./pages/ProjectSettings";
import TestDetails from "./pages/TestDetails";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      <Route
        path="/shared/:token"
        element={<Shared />}
      />

      <Route element={<AuthLayout />}>
        <Route
          path="/"
          element={<Tests />}
        />

        <Route
          path="/tests"
          element={<Tests />}
        />

        <Route
          path="/tests/:id"
          element={<TestDetails />}
        />

        <Route
          path="/compare"
          element={<Compare />}
        />

        <Route
          path="/api-key"
          element={<ApiKey />}
        />

        <Route
          path="/account"
          element={<Account />}
        />

        <Route
          path="/sessions"
          element={<Home />}
        />

        <Route
          path="/sessions/:id"
          element={<SessionDetails />}
        />

        <Route
          path="/projects"
          element={<ProjectSettings />}
        />

        <Route
          path="/projects/:id"
          element={<ProjectSettings />}
        />
      </Route>
    </Routes>
  );
}