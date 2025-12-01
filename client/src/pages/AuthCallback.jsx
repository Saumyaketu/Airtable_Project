import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;
    const code = searchParams.get('code');
    const codeVerifier = localStorage.getItem('code_verifier');

    if (code && codeVerifier) {
      axios.post(`${import.meta.env.VITE_API_URL}/api/auth/callback`, { code, codeVerifier })
        .then(res => {
          localStorage.setItem('token', res.data.token);
          localStorage.removeItem('code_verifier');
          navigate('/dashboard');
        })
        .catch(err => {
          console.error(err);
        });
    }
  }, []);

  return <div>Authenticating...</div>;
};

export default AuthCallback;