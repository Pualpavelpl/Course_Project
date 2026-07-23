import { useState } from "react";
import { Button, Navbar, Offcanvas } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import type { NavigationItem } from "../config/navigation";
import { ThemeToggle } from "../shared/theme/ThemeToggle";
import { SidebarNavigation } from "../shared/ui/SidebarNavigation";

interface AppLayoutProps {
  accountLabel: string;
  navigationItems: NavigationItem[];
}

export function AppLayout({ accountLabel, navigationItems }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = (
    <SidebarNavigation
      items={navigationItems}
      onNavigate={() => setMobileMenuOpen(false)}
    />
  );

  return (
    <div className="app-shell">
      <Navbar className="border-bottom bg-body px-3 py-3">
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
        <div className="ms-auto">
          <ThemeToggle id="app-theme-toggle" />
        </div>
      </Navbar>

      <div className="d-flex flex-grow-1">
        <aside className="app-sidebar d-none d-md-block border-end bg-body">
          {navigation}
        </aside>

        <main className="flex-grow-1 p-3 p-md-4 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <footer className="border-top bg-body py-3 text-center text-secondary small">
        Recruitment platform
      </footer>

      <Offcanvas
        show={mobileMenuOpen}
        onHide={() => setMobileMenuOpen(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{accountLabel}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">{navigation}</Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
