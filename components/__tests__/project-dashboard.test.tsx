import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectDashboard } from "../project-dashboard";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/use-local-storage", () => ({
  useLocalStorage: jest.fn(),
}));

// Mock child components
jest.mock("../create-project-modal", () => ({
  CreateProjectModal: ({ isOpen, onClose, onCreateProject }: any) =>
    isOpen ? (
      <div data-testid="create-project-modal">
        <button
          onClick={() => {
            onCreateProject({ id: "1", name: "New Project" });
            onClose();
          }}
        >
          Create Project
        </button>
      </div>
    ) : null,
}));

jest.mock("../server-management-modal", () => ({
  ServerManagementModal: ({ isOpen }: any) =>
    isOpen ? (
      <div data-testid="server-management-modal">Server Management</div>
    ) : null,
}));

jest.mock("../import-project-modal", () => ({
  ImportProjectModal: ({ isOpen, onClose, onImportProject }: any) =>
    isOpen ? (
      <div data-testid="import-project-modal">
        <button
          onClick={() => {
            onImportProject({ id: "2", name: "Imported Project" });
            onClose();
          }}
        >
          Import Project
        </button>
      </div>
    ) : null,
}));

describe("ProjectDashboard", () => {
  const mockPush = jest.fn();
  const mockSetProjects = jest.fn();

  const mockProjects = [
    {
      id: "1",
      name: "Test Project 1",
      description: "Description 1",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Test Project 2",
      description: "Description 2",
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useLocalStorage as jest.Mock).mockReturnValue([
      mockProjects,
      mockSetProjects,
    ]);
  });

  it("renders the dashboard with projects", () => {
    render(<ProjectDashboard />);

    expect(screen.getByText("Create your own pipeline")).toBeInTheDocument();
    expect(screen.getByText("Test Project 1")).toBeInTheDocument();
    expect(screen.getByText("Test Project 2")).toBeInTheDocument();
    expect(screen.getByText("Description 1")).toBeInTheDocument();
    expect(screen.getByText("Description 2")).toBeInTheDocument();
  });

  it("filters projects based on search query", async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "Project 1");

    expect(screen.getByText("Test Project 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Project 2")).not.toBeInTheDocument();
  });

  it("shows empty state when no projects exist", () => {
    (useLocalStorage as jest.Mock).mockReturnValue([[], mockSetProjects]);

    render(<ProjectDashboard />);

    // When no projects exist, only the "Create New Project" card should be visible
    expect(screen.getByText("Create New Project")).toBeInTheDocument();
    expect(screen.queryByText("Test Project 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Project 2")).not.toBeInTheDocument();
  });

  it("opens create project modal when clicking new project button", async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const newProjectButton = screen.getByText("Create New Project");
    await user.click(newProjectButton);

    expect(screen.getByTestId("create-project-modal")).toBeInTheDocument();
  });

  it("opens server management modal when clicking server management button", async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const serverButton = screen.getByRole("button", {
      name: /manage servers/i,
    });
    await user.click(serverButton);

    expect(screen.getByTestId("server-management-modal")).toBeInTheDocument();
  });

  it("opens import project modal when clicking import button", async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const importButton = screen.getByRole("button", {
      name: /import project/i,
    });
    await user.click(importButton);

    expect(screen.getByTestId("import-project-modal")).toBeInTheDocument();
  });

  it("navigates to project page when clicking on a project", async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const projectCard = screen.getByText("Test Project 1");
    await user.click(projectCard);

    expect(mockPush).toHaveBeenCalledWith("/project?id=1");
  });

  it("creates a new project through the modal", async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    // Open create modal
    const newProjectButton = screen.getByText("Create New Project");
    await user.click(newProjectButton);

    // Click create in the mocked modal
    const createButton = screen.getByText("Create Project");
    await user.click(createButton);

    expect(mockSetProjects).toHaveBeenCalledWith([
      ...mockProjects,
      { id: "1", name: "New Project" },
    ]);
  });
});
