import React from 'react';

const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};


const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const Login = () => {
  const handleLogin = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = 'random_state_' + Math.random().toString(36).substring(7);

    localStorage.setItem('code_verifier', codeVerifier);

    const root = 'https://airtable.com/oauth2/v1/authorize';
    const currentUrl = window.location.origin; 
    const redirectUri = `${currentUrl}/auth/callback`;

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_AIRTABLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'data.records:read data.records:write schema.bases:read webhook:manage',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    window.location.href = `${root}?${params.toString()}`;
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button 
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition"
      >
        Connect with Airtable
      </button>
    </div>
  );
};

export default Login;