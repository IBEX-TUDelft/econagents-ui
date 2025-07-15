"use client";

import { useLocalStorage } from "./use-local-storage";

export const useCustomStateTypes = () => {
  const [customTypes, setCustomTypes] = useLocalStorage<string[]>(
    "customStateTypes",
    []
  );

  const addCustomType = (newType: string) => {
    if (newType && !customTypes.includes(newType)) {
      setCustomTypes([...customTypes, newType]);
    }
  };

  return { customTypes, addCustomType };
};
