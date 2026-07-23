import { Navigate, Route, Routes } from "react-router-dom";
import { candidateNavigation } from "./config/candidateNavigation";
import { recruiterNavigation } from "./config/recruiterNavigation";
import { AppLayout } from "./layouts/AppLayout";
import { AttributeLibraryPage } from "./pages/attributes/AttributeLibraryPage";
import { CreateAttributePage } from "./pages/attributes/CreateAttributePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AddProfileAttributePage } from "./pages/candidate/AddProfileAttributePage";
import { CandidateCvPage } from "./pages/candidate/CandidateCvPage";
import { CandidateCvsPage } from "./pages/candidate/CandidateCvsPage";
import { CandidatePositionPage } from "./pages/candidate/CandidatePositionPage";
import { CandidatePositionsPage } from "./pages/candidate/CandidatePositionsPage";
import { CandidateProfilePage } from "./pages/candidate/CandidateProfilePage";
import { CreateProjectPage } from "./pages/candidate/CreateProjectPage";
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
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/recruiter"
        element={<AppLayout accountLabel="Recruiter" navigationItems={recruiterNavigation} />}
      >
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

      <Route
        path="/candidate"
        element={<AppLayout accountLabel="Candidate" navigationItems={candidateNavigation} />}
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="positions" element={<CandidatePositionsPage />} />
        <Route path="positions/:positionId" element={<CandidatePositionPage />} />
        <Route path="profile" element={<CandidateProfilePage />} />
        <Route path="profile/me/edit" element={<PlaceholderPage title="Edit profile attribute" />} />
        <Route path="profile/attributes/add" element={<AddProfileAttributePage />} />
        <Route
          path="profile/attributes/:attributeId/edit"
          element={<PlaceholderPage title="Edit profile attribute" />}
        />
        <Route path="profile/projects/new" element={<CreateProjectPage />} />
        <Route
          path="profile/projects/:projectId/edit"
          element={<PlaceholderPage title="Edit project" />}
        />
        <Route path="cvs" element={<CandidateCvsPage />} />
        <Route path="cvs/:cvId" element={<CandidateCvPage />} />
        <Route path="cvs/:cvId/edit" element={<PlaceholderPage title="Edit CV" />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
