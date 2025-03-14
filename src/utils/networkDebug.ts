// Create a new file for network debugging

// Function to monitor fetch requests
export const monitorFetch = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [url, options] = args;
    console.log(`Fetch request to: ${url}`, options);
    
    try {
      const response = await originalFetch.apply(this, args);
      
      // Clone the response to inspect it without consuming it
      const clone = response.clone();
      
      // Try to parse as JSON to see if it's valid
      clone.text().then(text => {
        try {
          if (text.trim().startsWith('<!DOCTYPE')) {
            console.error('Received HTML instead of expected JSON:', text.substring(0, 100) + '...');
          } else if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            // Valid JSON
            console.log(`Valid JSON response from ${url}`);
          } else {
            console.warn(`Unexpected response format from ${url}:`, text.substring(0, 100) + '...');
          }
        } catch (e) {
          console.error(`Error parsing response from ${url}:`, e);
        }
      }).catch(err => {
        console.error(`Error reading response from ${url}:`, err);
      });
      
      return response;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };
  
  console.log('Fetch monitoring enabled');
}; 