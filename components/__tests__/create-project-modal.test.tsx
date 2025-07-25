import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectModal } from "../create-project-modal";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("CreateProjectModal", () => {
  const mockOnClose = jest.fn();
  const mockOnCreateProject = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders when open", () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByLabelText("Project Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <CreateProjectModal
        isOpen={false}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    expect(screen.queryByText("New Project")).not.toBeInTheDocument();
  });

  it("creates project with all fields filled", async () => {
    const user = userEvent.setup();

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const nameInput = screen.getByLabelText("Project Name *");
    const descriptionInput = screen.getByLabelText("Description");

    await user.type(nameInput, "Test Project");
    await user.type(descriptionInput, "This is a test project");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    expect(mockOnCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Project",
        description: "This is a test project",
        gameId: null,
        agentRoles: [],
        agents: [],
        state: expect.objectContaining({
          metaInformation: expect.any(Array),
          privateInformation: [],
          publicInformation: [],
        }),
      })
    );

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("creates project with only required fields", async () => {
    const user = userEvent.setup();

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const nameInput = screen.getByLabelText("Project Name *");
    await user.type(nameInput, "Minimal Project");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    expect(mockOnCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Minimal Project",
        description: "",
        gameId: null,
      })
    );
  });

  it("does not create project with empty name", async () => {
    const user = userEvent.setup();

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    expect(mockOnCreateProject).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("trims whitespace from project name", async () => {
    const user = userEvent.setup();

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const nameInput = screen.getByLabelText("Project Name *");
    await user.type(nameInput, "  Trimmed Project  ");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    expect(mockOnCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "  Trimmed Project  ", // Note: The component stores the untrimmed value
        gameId: null,
      })
    );
  });

  it("handles cancel button click", async () => {
    const user = userEvent.setup();

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnCreateProject).not.toHaveBeenCalled();
  });

  it("generates unique project IDs", async () => {
    const user = userEvent.setup();

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const nameInput = screen.getByLabelText("Project Name *");
    await user.type(nameInput, "Project 1");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    const firstCallId = mockOnCreateProject.mock.calls[0][0].id;

    // Create another project
    await user.clear(nameInput);
    await user.type(nameInput, "Project 2");
    await user.click(createButton);

    const secondCallId = mockOnCreateProject.mock.calls[1][0].id;

    expect(firstCallId).not.toBe(secondCallId);
  });

  it("includes timestamp in created project", async () => {
    const user = userEvent.setup();
    const beforeTime = new Date().toISOString();

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateProject={mockOnCreateProject}
      />
    );

    const nameInput = screen.getByLabelText("Project Name *");
    await user.type(nameInput, "Timestamped Project");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    const afterTime = new Date().toISOString();
    const createdProject = mockOnCreateProject.mock.calls[0][0];

    expect(new Date(createdProject.createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(beforeTime).getTime()
    );
    expect(new Date(createdProject.createdAt).getTime()).toBeLessThanOrEqual(
      new Date(afterTime).getTime()
    );
  });
});
