import { cn } from '../utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class'
    );
    expect(result).toBe('base-class active-class');
  });

  it('merges tailwind classes with conflicts correctly', () => {
    // twMerge should resolve conflicts, keeping the last one
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('handles array inputs', () => {
    const result = cn(['text-sm', 'font-bold'], 'text-lg');
    expect(result).toBe('font-bold text-lg');
  });

  it('handles object inputs', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
      'font-bold': true,
    });
    expect(result).toBe('text-red-500 font-bold');
  });

  it('handles undefined and null values', () => {
    const result = cn('base-class', undefined, null, 'another-class');
    expect(result).toBe('base-class another-class');
  });

  it('handles empty strings', () => {
    const result = cn('', 'text-sm', '');
    expect(result).toBe('text-sm');
  });

  it('returns empty string when no valid classes provided', () => {
    const result = cn(undefined, null, false, '');
    expect(result).toBe('');
  });
});