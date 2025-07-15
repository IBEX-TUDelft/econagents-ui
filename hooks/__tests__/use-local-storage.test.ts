import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../use-local-storage';

describe('useLocalStorage hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any console errors
    jest.clearAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));
    
    expect(result.current[0]).toBe('initialValue');
  });

  it('returns value from localStorage if it exists', () => {
    localStorage.setItem('existingKey', JSON.stringify('existingValue'));
    
    const { result } = renderHook(() => useLocalStorage('existingKey', 'initialValue'));
    
    expect(result.current[0]).toBe('existingValue');
  });

  it('updates localStorage when setting a new value', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));
    
    act(() => {
      result.current[1]('newValue');
    });
    
    expect(result.current[0]).toBe('newValue');
    expect(localStorage.getItem('testKey')).toBe(JSON.stringify('newValue'));
  });

  it('handles objects correctly', () => {
    const initialObject = { name: 'test', value: 123 };
    const { result } = renderHook(() => useLocalStorage('objectKey', initialObject));
    
    expect(result.current[0]).toEqual(initialObject);
    
    const newObject = { name: 'updated', value: 456 };
    act(() => {
      result.current[1](newObject);
    });
    
    expect(result.current[0]).toEqual(newObject);
    expect(JSON.parse(localStorage.getItem('objectKey')!)).toEqual(newObject);
  });

  it('handles arrays correctly', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() => useLocalStorage('arrayKey', initialArray));
    
    expect(result.current[0]).toEqual(initialArray);
    
    const newArray = [4, 5, 6];
    act(() => {
      result.current[1](newArray);
    });
    
    expect(result.current[0]).toEqual(newArray);
    expect(JSON.parse(localStorage.getItem('arrayKey')!)).toEqual(newArray);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    localStorage.setItem('invalidKey', 'not valid JSON');
    
    const { result } = renderHook(() => useLocalStorage('invalidKey', 'fallback'));
    
    expect(result.current[0]).toBe('fallback');
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles localStorage errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    
    const { result } = renderHook(() => useLocalStorage('errorKey', 'initial'));
    
    act(() => {
      result.current[1]('newValue');
    });
    
    // State should still update even if localStorage fails
    expect(result.current[0]).toBe('newValue');
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('works with boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('boolKey', false));
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem('boolKey')).toBe('true');
  });

  it('works with number values', () => {
    const { result } = renderHook(() => useLocalStorage('numberKey', 42));
    
    expect(result.current[0]).toBe(42);
    
    act(() => {
      result.current[1](100);
    });
    
    expect(result.current[0]).toBe(100);
    expect(localStorage.getItem('numberKey')).toBe('100');
  });

  it('works with null values', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('nullKey', null));
    
    expect(result.current[0]).toBe(null);
    
    act(() => {
      result.current[1]('notNull');
    });
    
    expect(result.current[0]).toBe('notNull');
    
    act(() => {
      result.current[1](null);
    });
    
    expect(result.current[0]).toBe(null);
    expect(localStorage.getItem('nullKey')).toBe('null');
  });
});