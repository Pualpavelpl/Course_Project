import { Navigate, Route, Routes } from "react-router-dom";
import { candidateNavigation } from "./config/candidateNavigation";
import { getEmployeeNavigation } from "./config/recruiterNavigation";
import { AppLayout } from "./layouts/AppLayout";
import { AttributeLibraryPage } from "./pages/attributes/AttributeLibraryPage";
import { CreateAttributePage } from "./pages/attributes/CreateAttributePage";
import { EditAttributePage } from "./pages/attributes/EditAttributePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AddProfileAttributePage } from "./pages/candidate/AddProfileAttributePage";
import { CandidateCvPage } from "./pages/candidate/CandidateCvPage";
import { CandidateCvsPage } from "./pages/candidate/CandidateCvsPage";
import { CandidatePositionPage } from "./pages/candidate/CandidatePositionPage";
import { CandidatePositionsPage } from "./pages/candidate/CandidatePositionsPage";
import { CandidateProfilePage } from "./pages/candidate/CandidateProfilePage";
import { CreateProjectPage } from "./pages/candidate/CreateProjectPage";
import { EditProfileAttributePage } from "./pages/candidate/EditProfileAttributePage";
import { EditProjectPage } from "./pages/candidate/EditProjectPage";
import { CvSearchPage } from "./pages/cvs/CvSearchPage";
import { RecruiterCvPage } from "./pages/cvs/RecruiterCvPage";
import { CreatePositionPage } from "./pages/positions/CreatePositionPage";
import { PositionDetailsPage } from "./pages/positions/PositionDetailsPage";
import { PositionsPage } from "./pages/positions/PositionsPage";
import { PlaceholderPage } from "./shared/ui/PlaceholderPage";
import { getStoredAuthUser } from "./shared/api/authApi";
import { RequireRole } from "./shared/auth/RequireRole";

function EmployeeLayout() {
  const isAdmin = getStoredAuthUser()?.role === "ADMIN";

  return (
    <AppLayout
      accountLabel={isAdmin ? "Admin" : "Recruiter"}
      navigationItems={getEmployeeNavigation(isAdmin)}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireRole roles={["RECRUITER", "ADMIN"]} />}>
        <Route path="/recruiter" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="positions" replace />} />
          <Route path="positions" element={<PositionsPage />} />
          <Route path="positions/:positionId" element={<PositionDetailsPage />} />
          <Route path="positions/new" element={<CreatePositionPage />} />
          <Route
            path="positions/:positionId/edit"
            element={<PlaceholderPage title="Edit position" />}
          />
          <Route path="attributes" element={<AttributeLibraryPage />} />
          <Route path="attributes/new" element={<CreateAttributePage />} />
          <Route
            path="attributes/:attributeId/edit"
            element={<EditAttributePage />}
          />
          <Route path="cv-search" element={<CvSearchPage />} />
          <Route
            path="profiles/:profileId"
            element={<PlaceholderPage title="Candidate profile" />}
          />
          <Route path="cvs/:cvId" element={<RecruiterCvPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={["CANDIDATE"]} />}>
        <Route
          path="/candidate"
          element={
            <AppLayout
              accountLabel="Candidate"
              navigationItems={candidateNavigation}
            />
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="positions" element={<CandidatePositionsPage />} />
          <Route path="positions/:positionId" element={<CandidatePositionPage />} />
          <Route path="profile" element={<CandidateProfilePage />} />
          <Route path="profile/me/edit" element={<Navigate to="../profile" replace />} />
          <Route path="profile/attributes/add" element={<AddProfileAttributePage />} />
          <Route
            path="profile/attributes/:attributeId/edit"
            element={<EditProfileAttributePage />}
          />
          <Route path="profile/projects/new" element={<CreateProjectPage />} />
          <Route
            path="profile/projects/:projectId/edit"
            element={<EditProjectPage />}
          />
          <Route path="cvs" element={<CandidateCvsPage />} />
          <Route path="cvs/:cvId" element={<CandidateCvPage />} />
          <Route path="cvs/:cvId/edit" element={<CandidateCvPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={["ADMIN"]} />}>
        <Route
          path="/admin"
          element={
            <AppLayout
              accountLabel="Admin"
              navigationItems={getEmployeeNavigation(true)}
            />
          }
        >
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route
            path="candidates/:candidateId/profile"
            element={<CandidateProfilePage />}
          />
          <Route
            path="candidates/:candidateId/profile/attributes/add"
            element={<AddProfileAttributePage />}
          />
          <Route
            path="candidates/:candidateId/profile/attributes/:attributeId/edit"
            element={<EditProfileAttributePage />}
          />
          <Route
            path="candidates/:candidateId/profile/projects/new"
            element={<CreateProjectPage />}
          />
          <Route
            path="candidates/:candidateId/profile/projects/:projectId/edit"
            element={<EditProjectPage />}
          />
          <Route
            path="candidates/:candidateId/cvs/:cvId"
            element={<CandidateCvPage />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
