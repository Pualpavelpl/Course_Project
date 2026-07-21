import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
      <h1 className="h3 mb-0">{title}</h1>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
