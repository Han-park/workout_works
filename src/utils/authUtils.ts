// Create a new file for auth utilities

// Simple debounce function for auth requests
export const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        resolve(func(...args));
      }, waitFor);
    });
  };
};

// Debounced version of signInWithPassword
export const debouncedSignIn = (
  signInFn: (email: string, password: string) => Promise<void>,
  email: string,
  password: string,
  delay = 1000
) => {
  const debouncedFn = debounce(
    async (e: string, p: string) => await signInFn(e, p),
    delay
  );
  
  return debouncedFn(email, password);
}; 