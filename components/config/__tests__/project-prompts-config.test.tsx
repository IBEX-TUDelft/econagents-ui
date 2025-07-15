import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectPromptsConfig } from '../project-prompts-config';
import type { AgentRole, PromptPartial, State } from '@/types';

describe('ProjectPromptsConfig - State Variable Insertion', () => {
  const mockOnUpdateAgentRoles = jest.fn();

  const mockState: State = {
    metaInformation: [
      { name: 'game_id', type: 'string' },
    ],
    publicInformation: [
      { name: 'price', type: 'number' },
    ],
    privateInformation: [
      { name: 'balance', type: 'number' },
    ],
  };

  const mockAgentRoles: AgentRole[] = [
    {
      roleId: 1,
      name: 'Trader',
      llmType: 'openai',
      llmParams: {
        modelName: 'gpt-4',
      },
      prompts: {
        system: 'Initial system prompt ',
        user: 'Initial user prompt ',
      },
      numberOfAgents: 1,
    },
  ];

  const mockPromptPartials: PromptPartial[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts state variable at cursor position in system prompt', async () => {
    render(
      <ProjectPromptsConfig
        agentRoles={mockAgentRoles}
        promptPartials={mockPromptPartials}
        state={mockState}
        onUpdateAgentRoles={mockOnUpdateAgentRoles}
      />
    );

    // First expand the accordion to show the content
    const accordionButton = screen.getByRole('button', { name: /Trader.*ID: 1/i });
    await userEvent.click(accordionButton);

    // Click to show state variables
    const showStateButton = screen.getAllByText(/Show State/)[0];
    await userEvent.click(showStateButton);

    // Wait for the content to be visible and get the system prompt textarea
    const systemTextarea = await screen.findByRole('textbox', { name: /System Prompt/i });
    expect(systemTextarea).toHaveValue('Initial system prompt ');

    // Set cursor position at the end
    fireEvent.click(systemTextarea);
    const initialPromptLength = 'Initial system prompt '.length;
    systemTextarea.setSelectionRange(initialPromptLength, initialPromptLength);

    // Click on game_id variable
    const gameIdBadge = screen.getByText('game_id');
    await userEvent.click(gameIdBadge);

    // Check that the updated agent roles have the inserted variable
    expect(mockOnUpdateAgentRoles).toHaveBeenCalledWith([
      {
        ...mockAgentRoles[0],
        prompts: {
          ...mockAgentRoles[0].prompts,
          system: 'Initial system prompt {{ meta.game_id }}',
        },
      },
    ]);
  });

  it('inserts state variable at cursor position in user prompt', async () => {
    render(
      <ProjectPromptsConfig
        agentRoles={mockAgentRoles}
        promptPartials={mockPromptPartials}
        state={mockState}
        onUpdateAgentRoles={mockOnUpdateAgentRoles}
      />
    );

    // First expand the accordion
    const accordionButton = screen.getByRole('button', { name: /Trader.*ID: 1/i });
    await userEvent.click(accordionButton);

    // Click to show state variables for user prompt
    const showStateButtons = screen.getAllByText(/Show State/);
    await userEvent.click(showStateButtons[1]); // Second button is for user prompt

    // Wait for the content to be visible and get the user prompt textarea
    const userTextarea = await screen.findByRole('textbox', { name: /User Prompt/i });
    expect(userTextarea).toHaveValue('Initial user prompt ');

    // Set cursor position in the middle
    fireEvent.click(userTextarea);
    userTextarea.setSelectionRange(7, 7); // After "Initial"

    // Click on price variable
    const priceBadge = screen.getByText('price');
    await userEvent.click(priceBadge);

    // Check that the updated agent roles have the inserted variable
    expect(mockOnUpdateAgentRoles).toHaveBeenCalledWith([
      {
        ...mockAgentRoles[0],
        prompts: {
          ...mockAgentRoles[0].prompts,
          user: 'Initial{{ public_information.price }} user prompt ',
        },
      },
    ]);
  });

  it('replaces selected text when inserting state variable', async () => {
    render(
      <ProjectPromptsConfig
        agentRoles={mockAgentRoles}
        promptPartials={mockPromptPartials}
        state={mockState}
        onUpdateAgentRoles={mockOnUpdateAgentRoles}
      />
    );

    // First expand the accordion
    const accordionButton = screen.getByRole('button', { name: /Trader.*ID: 1/i });
    await userEvent.click(accordionButton);

    // Click to show state variables
    const showStateButton = screen.getAllByText(/Show State/)[0];
    await userEvent.click(showStateButton);

    // Wait for the content to be visible and get the system prompt textarea
    const systemTextarea = await screen.findByRole('textbox', { name: /System Prompt/i });

    // Select "system" word
    fireEvent.click(systemTextarea);
    systemTextarea.setSelectionRange(8, 14); // Select "system"

    // Click on balance variable
    const balanceBadge = screen.getByText('balance');
    await userEvent.click(balanceBadge);

    // Check that the selected text was replaced
    expect(mockOnUpdateAgentRoles).toHaveBeenCalledWith([
      {
        ...mockAgentRoles[0],
        prompts: {
          ...mockAgentRoles[0].prompts,
          system: 'Initial {{ private_information.balance }} prompt ',
        },
      },
    ]);
  });

  it('inserts state variable in phase-specific prompts', async () => {
    const agentWithPhases: AgentRole[] = [
      {
        ...mockAgentRoles[0],
        prompts: {
          ...mockAgentRoles[0].prompts,
          system_phase_1: 'Phase 1 system prompt ',
          user_phase_1: 'Phase 1 user prompt ',
        },
      },
    ];

    render(
      <ProjectPromptsConfig
        agentRoles={agentWithPhases}
        promptPartials={mockPromptPartials}
        state={mockState}
        onUpdateAgentRoles={mockOnUpdateAgentRoles}
      />
    );

    // First expand the accordion
    const accordionButton = screen.getByRole('button', { name: /Trader.*ID: 1/i });
    await userEvent.click(accordionButton);

    // Find and click on phase-specific state variable button
    const phaseStateButtons = screen.getAllByText(/Show State/);
    // Third button should be for phase 1 system prompt
    await userEvent.click(phaseStateButtons[2]);

    // Get the phase system textarea and set cursor at the end
    const phaseSystemTextarea = await screen.findByRole('textbox', { name: /System Prompt \(Phase 1\)/i });
    expect(phaseSystemTextarea).toHaveValue('Phase 1 system prompt ');
    fireEvent.click(phaseSystemTextarea);
    const phasePromptLength = 'Phase 1 system prompt '.length;
    phaseSystemTextarea.setSelectionRange(phasePromptLength, phasePromptLength);

    // Click on game_id variable
    const gameIdBadges = screen.getAllByText('game_id');
    await userEvent.click(gameIdBadges[0]);

    // Check that the phase-specific prompt was updated
    const updatedRoles = mockOnUpdateAgentRoles.mock.calls[0][0];
    expect(updatedRoles[0].prompts.system_phase_1).toBe('Phase 1 system prompt {{ meta.game_id }}');
  });

  it('does not duplicate content when inserting variable', async () => {
    const longPrompt = 'This is a long prompt with multiple words and sentences. ';
    const agentWithLongPrompt: AgentRole[] = [
      {
        ...mockAgentRoles[0],
        prompts: {
          ...mockAgentRoles[0].prompts,
          system: longPrompt,
        },
      },
    ];

    render(
      <ProjectPromptsConfig
        agentRoles={agentWithLongPrompt}
        promptPartials={mockPromptPartials}
        state={mockState}
        onUpdateAgentRoles={mockOnUpdateAgentRoles}
      />
    );

    // First expand the accordion
    const accordionButton = screen.getByRole('button', { name: /Trader.*ID: 1/i });
    await userEvent.click(accordionButton);

    // Click to show state variables
    const showStateButton = screen.getAllByText(/Show State/)[0];
    await userEvent.click(showStateButton);

    // Wait for the content to be visible and get the system prompt textarea
    const systemTextarea = await screen.findByRole('textbox', { name: /System Prompt/i });
    expect(systemTextarea).toHaveValue(longPrompt);

    // Set cursor at the end
    fireEvent.click(systemTextarea);
    systemTextarea.setSelectionRange(longPrompt.length, longPrompt.length);

    // Click on game_id variable
    const gameIdBadge = screen.getByText('game_id');
    await userEvent.click(gameIdBadge);

    // Verify content is not duplicated
    const expectedPrompt = longPrompt + '{{ meta.game_id }}';
    expect(mockOnUpdateAgentRoles).toHaveBeenCalledWith([
      {
        ...agentWithLongPrompt[0],
        prompts: {
          ...agentWithLongPrompt[0].prompts,
          system: expectedPrompt,
        },
      },
    ]);

    // Ensure the original prompt appears only once
    const updatedPrompt = mockOnUpdateAgentRoles.mock.calls[0][0][0].prompts.system;
    const occurrences = (updatedPrompt.match(/This is a long prompt/g) || []).length;
    expect(occurrences).toBe(1);
  });
});