import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalConfig from '../../../config/GlobalConfig';

const LoggedInPrevent = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    if (token) {
      // Check if the token is valid
      const checkTokenValidity = async () => {
        try {
          const response = await fetch(`${GlobalConfig.nodeUrl}/api/validate-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            // If valid, redirect to the default logged-in page
            navigate('/myTickets');
          } else {
            // If invalid, clear the token and allow access to the children component
            sessionStorage.removeItem('token');
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Token validation failed', error);
          sessionStorage.removeItem('token');
          setIsLoading(false);
        }
      };

      checkTokenValidity();
    } else {
      // No token, allow access to the children component
      setIsLoading(false);
    }
  }, [navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return children;
};

export default LoggedInPrevent;
