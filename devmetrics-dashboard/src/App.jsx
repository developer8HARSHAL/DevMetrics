import { Routes, Route } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Analytics from "./pages/Metrics";
import ApiKey from "./pages/Api-key";
import SessionDetails from "./pages/session/Sessiondetails";
import Shared from "./pages/Shared";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/shared/:token" element={<Shared />} />
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/api-key" element={<ApiKey />} />
        <Route path="/sessions/:id" element={<SessionDetails />} />
      </Route>
    </Routes>
  );
}
