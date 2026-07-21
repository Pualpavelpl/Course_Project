import { useState } from "react";
import { Button, Navbar, Offcanvas } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import { recruiterNavigation } from "../config/recruiterNavigation";
import { SidebarNavigation } from "../shared/ui/SidebarNavigation";

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = (
    <SidebarNavigation
      items={recruiterNavigation}
      onNavigate={() => setMobileMenuOpen(false)}
    />
  );

  return (
    <div className="app-shell">
      <Navbar className="border-bottom bg-white px-3 py-3">
        <Button
          variant="outline-secondary"
          className="d-md-none me-2"
          aria-label="Open navigation"
          onClick={() => setMobileMenuOpen(true)}
        >
          Menu
        </Button>
        <Navbar.Brand className="mb-0 fw-semibold">
          Recruitment platform
        </Navbar.Brand>
      </Navbar>

      <div className="d-flex flex-grow-1">
        <aside className="app-sidebar d-none d-md-block border-end bg-white">
          {navigation}
        </aside>

        <main className="flex-grow-1 p-3 p-md-4 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <footer className="border-top bg-white py-3 text-center text-secondary small">
        Recruitment platform
      </footer>

      <Offcanvas
        show={mobileMenuOpen}
        onHide={() => setMobileMenuOpen(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Recruiter</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">{navigation}</Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
