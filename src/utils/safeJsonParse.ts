/**
 * Safely parses JSON and handles HTML responses
 * @param text The text to parse as JSON
 * @returns Parsed JSON object or null if parsing fails
 */
export const safeJsonParse = (text: string) => {
  // Check if the response looks like HTML
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    console.error('Received HTML instead of JSON:', text.substring(0, 100) + '...');
    throw new Error('Received HTML response instead of JSON. Server might be returning an error page.');
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Raw text:', text.substring(0, 200));
    throw new Error('Failed to parse JSON response');
  }
};

/**
 * Wrapper for fetch that handles HTML responses
 */
export const safeFetch = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  
  // Check if response is OK
  if (!response.ok) {
    const text = await response.text();
    
    // Check if the error response is HTML
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.error('Received HTML error response:', text.substring(0, 100) + '...');
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    // Try to parse as JSON error
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // If parsing fails, throw the original error
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }
  
  // For successful responses, try to parse as JSON
  const text = await response.text();
  return safeJsonParse(text);
}; 