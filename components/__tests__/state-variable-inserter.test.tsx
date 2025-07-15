import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StateVariableInserter } from '../state-variable-inserter';
import type { State } from '@/types';

describe('StateVariableInserter', () => {
  const mockOnInsert = jest.fn();
  let textareaRef: React.RefObject<HTMLTextAreaElement>;

  const mockState: State = {
    metaInformation: [
      { name: 'game_id', type: 'string' },
      { name: 'round', type: 'number' },
    ],
    publicInformation: [
      { name: 'price', type: 'number' },
      { name: 'volume', type: 'number' },
    ],
    privateInformation: [
      { name: 'balance', type: 'number' },
      { name: 'inventory', type: 'number' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    textareaRef = {
      current: document.createElement('textarea'),
    };
    textareaRef.current.value = 'Initial content ';
    textareaRef.current.selectionStart = textareaRef.current.value.length;
    textareaRef.current.selectionEnd = textareaRef.current.value.length;
  });

  it('renders nothing when state is undefined', () => {
    const { container } = render(
      <StateVariableInserter
        state={undefined}
        textareaRef={textareaRef}
        onInsert={mockOnInsert}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all state fields grouped by type', () => {
    render(
      <StateVariableInserter
        state={mockState}
        textareaRef={textareaRef}
        onInsert={mockOnInsert}
      />
    );

    // Check meta information fields
    expect(screen.getByText('meta Information')).toBeInTheDocument();
    expect(screen.getByText('game_id')).toBeInTheDocument();
    expect(screen.getByText('round')).toBeInTheDocument();

    // Check public information fields
    expect(screen.getByText('public Information')).toBeInTheDocument();
    expect(screen.getByText('price')).toBeInTheDocument();
    expect(screen.getByText('volume')).toBeInTheDocument();

    // Check private information fields
    expect(screen.getByText('private Information')).toBeInTheDocument();
    expect(screen.getByText('balance')).toBeInTheDocument();
    expect(screen.getByText('inventory')).toBeInTheDocument();
  });

  it('inserts only the variable text when clicking a meta field', async () => {
    render(
      <StateVariableInserter
        state={mockState}
        textareaRef={textareaRef}
        onInsert={mockOnInsert}
      />
    );

    const gameIdBadge = screen.getByText('game_id');
    await userEvent.click(gameIdBadge);

    expect(mockOnInsert).toHaveBeenCalledWith('{{ meta.game_id }}');
    expect(mockOnInsert).toHaveBeenCalledTimes(1);
  });

  it('inserts only the variable text when clicking a public field', async () => {
    render(
      <StateVariableInserter
        state={mockState}
        textareaRef={textareaRef}
        onInsert={mockOnInsert}
      />
    );

    const priceBadge = screen.getByText('price');
    await userEvent.click(priceBadge);

    expect(mockOnInsert).toHaveBeenCalledWith('{{ public_information.price }}');
    expect(mockOnInsert).toHaveBeenCalledTimes(1);
  });

  it('inserts only the variable text when clicking a private field', async () => {
    render(
      <StateVariableInserter
        state={mockState}
        textareaRef={textareaRef}
        onInsert={mockOnInsert}
      />
    );

    const balanceBadge = screen.getByText('balance');
    await userEvent.click(balanceBadge);

    expect(mockOnInsert).toHaveBeenCalledWith('{{ private_information.balance }}');
    expect(mockOnInsert).toHaveBeenCalledTimes(1);
  });

  it('shows correct tooltip on badges', () => {
    render(
      <StateVariableInserter
        state={mockState}
        textareaRef={textareaRef}
        onInsert={mockOnInsert}
      />
    );

    const gameIdBadge = screen.getByText('game_id');
    expect(gameIdBadge).toHaveAttribute(
      'title',
      'Click to insert {{ meta.game_id }}'
    );

    const priceBadge = screen.getByText('price');
    expect(priceBadge).toHaveAttribute(
      'title',
      'Click to insert {{ public_information.price }}'
    );
  });

  it('handles empty field arrays gracefully', () => {
    const emptyState: State = {
      metaInformation: [],
      publicInformation: [],
      privateInformation: [],
    };

    render(
      <StateVariableInserter
        state={emptyState}
        textareaRef={textareaRef}
        onInsert={mockOnInsert}
      />
    );

    // Should render the container but no labels or fields
    expect(screen.queryByText('meta Information')).not.toBeInTheDocument();
    expect(screen.queryByText('public Information')).not.toBeInTheDocument();
    expect(screen.queryByText('private Information')).not.toBeInTheDocument();
  });

  it('handles missing textarea ref gracefully', async () => {
    const emptyRef: React.RefObject<HTMLTextAreaElement> = { current: null };

    render(
      <StateVariableInserter
        state={mockState}
        textareaRef={emptyRef}
        onInsert={mockOnInsert}
      />
    );

    const gameIdBadge = screen.getByText('game_id');
    await userEvent.click(gameIdBadge);

    // Should not call onInsert when textarea ref is null
    expect(mockOnInsert).not.toHaveBeenCalled();
  });

  it('focuses textarea after insertion', async () => {
    jest.useFakeTimers();
    const focusSpy = jest.spyOn(textareaRef.current, 'focus');

    render(
      <StateVariableInserter
        state={mockState}
        textareaRef={textareaRef}
        onInsert={mockOnInsert}
      />
    );

    const gameIdBadge = screen.getByText('game_id');
    fireEvent.click(gameIdBadge);

    // Fast forward timers to trigger the setTimeout
    jest.runAllTimers();

    expect(focusSpy).toHaveBeenCalled();
    // The cursor position is set based on the original position plus the inserted text length
    // But since we're not actually updating the value in the test, just verify focus was called

    jest.useRealTimers();
  });
});