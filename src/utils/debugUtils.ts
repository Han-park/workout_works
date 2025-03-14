// Create a new file for debugging utilities

// Global counter for auth requests
let authRequestCount = 0;
const authRequestTimes: number[] = [];
const authRequestSources: string[] = [];

// Function to track auth requests
export const trackAuthRequest = (source: string) => {
  authRequestCount++;
  authRequestTimes.push(Date.now());
  authRequestSources.push(source);
  
  // Keep only the last 100 requests
  if (authRequestTimes.length > 100) {
    authRequestTimes.shift();
    authRequestSources.shift();
  }
  
  // Log if we're seeing a high frequency
  const recentRequests = authRequestTimes.filter(time => Date.now() - time < 10000);
  if (recentRequests.length > 10) {
    console.warn(`High auth request frequency detected: ${recentRequests.length} requests in the last 10 seconds`);
    console.warn(`Last 5 sources: ${authRequestSources.slice(-5).join(', ')}`);
  }
  
  return authRequestCount;
};

// Function to get auth request stats
export const getAuthStats = () => {
  const recentRequests = authRequestTimes.filter(time => Date.now() - time < 10000);
  return {
    total: authRequestCount,
    recent: recentRequests.length,
    sources: authRequestSources.slice(-10)
  };
}; 