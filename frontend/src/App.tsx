import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { AttributeLibraryPage } from "./pages/attributes/AttributeLibraryPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { PositionDetailsPage } from "./pages/positions/PositionDetailsPage";
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
        <Route path="positions/:positionId" element={<PositionDetailsPage />} />
        <Route
          path="positions/new"
          element={<PlaceholderPage title="Create position" />}
        />
        <Route
          path="positions/:positionId/edit"
          element={<PlaceholderPage title="Edit position" />}
        />
        <Route path="attributes" element={<AttributeLibraryPage />} />
        <Route
          path="attributes/new"
          element={<PlaceholderPage title="Create attribute" />}
        />
        <Route
          path="attributes/:attributeId/edit"
          element={<PlaceholderPage title="Edit attribute" />}
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
