// Get Bearer token for X API app-only authentication
export async function getXBearerToken(clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://api.twitter.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      console.error('Failed to get X Bearer token:', response.statusText);
      return null;
    }

    const data = await response.json() as { access_token?: string };
    return data.access_token || null;
  } catch (error) {
    console.error('Error getting X Bearer token:', error);
    return null;
  }
}

// Get X user ID from username
export async function getXUserIdFromUsername(username: string, bearerToken: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    if (!response.ok) {
      console.error(`Failed to get user ID for @${username}:`, response.statusText);
      return null;
    }

    const data = await response.json() as { data?: { id: string } };
    return data.data?.id || null;
  } catch (error) {
    console.error(`Error getting user ID for @${username}:`, error);
    return null;
  }
}
