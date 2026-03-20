/**
 * Logout utility function to clear all auth data and redirect to home
 */
export const logout = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    // Try to call logout endpoint if available
    if (token) {
      try {
        await fetch('http://localhost:8000/dj-rest-auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Backend logout failed:', err);
        // Continue with client-side logout even if backend fails
      }
    }

    // Clear all auth-related localStorage items
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    // Dispatch logout event so Layout can clear user state
    window.dispatchEvent(new CustomEvent('logout'));
    
    // Redirect to home page
    window.location.href = '/';
  } catch (err) {
    console.error('Logout error:', err);
    // Still redirect to home even if error
    window.location.href = '/';
  }
};
