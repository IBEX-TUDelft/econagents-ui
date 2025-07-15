import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectDashboard } from '../project-dashboard';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-local-storage', () => ({
  useLocalStorage: jest.fn(),
}));

// Mock child components
jest.mock('../create-project-modal', () => ({
  CreateProjectModal: ({ isOpen, onClose, onCreateProject }: any) => 
    isOpen ? (
      <div data-testid="create-project-modal">
        <button onClick={() => {
          onCreateProject({ id: '1', name: 'New Project' });
          onClose();
        }}>
          Create Project
        </button>
      </div>
    ) : null,
}));

jest.mock('../server-management-modal', () => ({
  ServerManagementModal: ({ isOpen }: any) => 
    isOpen ? <div data-testid="server-management-modal">Server Management</div> : null,
}));

jest.mock('../import-project-modal', () => ({
  ImportProjectModal: ({ isOpen, onClose, onImportProject }: any) => 
    isOpen ? (
      <div data-testid="import-project-modal">
        <button onClick={() => {
          onImportProject({ id: '2', name: 'Imported Project' });
          onClose();
        }}>
          Import Project
        </button>
      </div>
    ) : null,
}));

describe('ProjectDashboard', () => {
  const mockPush = jest.fn();
  const mockSetProjects = jest.fn();

  const mockProjects = [
    {
      id: '1',
      name: 'Test Project 1',
      description: 'Description 1',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Test Project 2',
      description: 'Description 2',
      createdAt: '2024-01-02T00:00:00Z',
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

  it('renders the dashboard with projects', () => {
    render(<ProjectDashboard />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('filters projects based on search query', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    await user.type(searchInput, 'Project 1');

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
  });

  it('shows empty state when no projects exist', () => {
    (useLocalStorage as jest.Mock).mockReturnValue([[], mockSetProjects]);
    
    render(<ProjectDashboard />);

    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
  });

  it('opens create project modal when clicking new project button', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    await user.click(newProjectButton);

    expect(screen.getByTestId('create-project-modal')).toBeInTheDocument();
  });

  it('opens server management modal when clicking server management button', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const serverButton = screen.getByRole('button', { name: /server management/i });
    await user.click(serverButton);

    expect(screen.getByTestId('server-management-modal')).toBeInTheDocument();
  });

  it('opens import project modal when clicking import button', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const importButton = screen.getByRole('button', { name: /import yaml/i });
    await user.click(importButton);

    expect(screen.getByTestId('import-project-modal')).toBeInTheDocument();
  });

  it('navigates to project page when clicking on a project', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    const projectCard = screen.getByText('Test Project 1').closest('div[role="button"]');
    await user.click(projectCard!);

    expect(mockPush).toHaveBeenCalledWith('/project?id=1');
  });

  it('deletes a project after confirmation', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    // Click delete button on first project
    const deleteButtons = screen.getAllByRole('button', { name: /delete project/i });
    await user.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    expect(mockSetProjects).toHaveBeenCalledWith([mockProjects[1]]);
  });

  it('cancels project deletion', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    // Click delete button on first project
    const deleteButtons = screen.getAllByRole('button', { name: /delete project/i });
    await user.click(deleteButtons[0]);

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockSetProjects).not.toHaveBeenCalled();
  });

  it('creates a new project through the modal', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    // Open create modal
    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    await user.click(newProjectButton);

    // Click create in the mocked modal
    const createButton = screen.getByText('Create Project');
    await user.click(createButton);

    expect(mockSetProjects).toHaveBeenCalledWith([
      ...mockProjects,
      { id: '1', name: 'New Project' },
    ]);
  });

  it('imports a project through the modal', async () => {
    const user = userEvent.setup();
    render(<ProjectDashboard />);

    // Open import modal
    const importButton = screen.getByRole('button', { name: /import yaml/i });
    await user.click(importButton);

    // Click import in the mocked modal
    const importProjectButton = screen.getByText('Import Project');
    await user.click(importProjectButton);

    expect(mockSetProjects).toHaveBeenCalledWith([
      ...mockProjects,
      { id: '2', name: 'Imported Project' },
    ]);
  });

  it('displays project count correctly', () => {
    render(<ProjectDashboard />);

    const projectCount = screen.getByText(`${mockProjects.length} project${mockProjects.length !== 1 ? 's' : ''}`);
    expect(projectCount).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<ProjectDashboard />);

    // The component uses toLocaleDateString, so we need to check for a date format
    // This is a simplified check - in real tests you might want to mock the date
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/1\/2\/2024/)).toBeInTheDocument();
  });
});