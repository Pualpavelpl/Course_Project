import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { AttributeLibraryPage } from "./pages/attributes/AttributeLibraryPage";
import { CreateAttributePage } from "./pages/attributes/CreateAttributePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { CvSearchPage } from "./pages/cvs/CvSearchPage";
import { CreatePositionPage } from "./pages/positions/CreatePositionPage";
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
          element={<CreatePositionPage />}
        />
        <Route
          path="positions/:positionId/edit"
          element={<PlaceholderPage title="Edit position" />}
        />
        <Route path="attributes" element={<AttributeLibraryPage />} />
        <Route
          path="attributes/new"
          element={<CreateAttributePage />}
        />
        <Route
          path="attributes/:attributeId/edit"
          element={<PlaceholderPage title="Edit attribute" />}
        />
        <Route path="cv-search" element={<CvSearchPage />} />
        <Route
          path="profiles/:profileId"
          element={<PlaceholderPage title="Candidate profile" />}
        />
        <Route path="cvs/:cvId" element={<PlaceholderPage title="Candidate CV" />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
