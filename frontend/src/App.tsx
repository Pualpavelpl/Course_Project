import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { PositionsPage } from "./pages/positions/PositionsPage";
import { PlaceholderPage } from "./shared/ui/PlaceholderPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/recruiter" element={<AppLayout />}>
        <Route index element={<Navigate to="positions" replace />} />
        <Route path="positions" element={<PositionsPage />} />
        <Route
          path="positions/new"
          element={<PlaceholderPage title="Create position" />}
        />
        <Route
          path="positions/:positionId/edit"
          element={<PlaceholderPage title="Edit position" />}
        />
        <Route
          path="attributes"
          element={<PlaceholderPage title="Attribute library" />}
        />
        <Route
          path="cv-search"
          element={<PlaceholderPage title="CV search" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
