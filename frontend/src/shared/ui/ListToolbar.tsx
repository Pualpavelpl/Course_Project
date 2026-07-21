import type { ReactNode } from "react";
import { Dropdown, Form } from "react-bootstrap";

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  filter?: {
    labels: string[];
    index: number | undefined;
    onChange: (index: number | undefined) => void;
  };
  actions?: ReactNode;
}

export function ListToolbar({
  search,
  onSearchChange,
  searchLabel,
  filter,
  actions,
}: ListToolbarProps) {
  return (
    <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
      <div className="d-flex flex-column flex-sm-row gap-2">
        {filter ? (
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary">Filter</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item active={filter.index === undefined} onClick={() => filter.onChange(undefined)}>
                All
              </Dropdown.Item>
              {filter.labels.map((label, index) => (
                <Dropdown.Item
                  key={label}
                  active={filter.index === index}
                  onClick={() => filter.onChange(index)}
                >
                  {label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        ) : null}
        <Form.Control
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          aria-label={searchLabel}
          className="search-control"
        />
      </div>
      {actions ? <div className="d-flex gap-2">{actions}</div> : null}
    </div>
  );
}
