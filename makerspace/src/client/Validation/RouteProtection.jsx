import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalConfig from '../../../config/GlobalConfig';
import {useSnackbar } from "notistack"
import Swal from 'sweetalert2';
const RouteProtection = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem('token');

    if (!token) {
      enqueueSnackbar("You are not logged in", { variant: 'error' })
      navigate('/signin');
      return;
    }

    // Replace with your API call to check if the token is valid
    const checkTokenValidity = async () => {
      try {
        const response = await fetch(`${GlobalConfig.nodeUrl}/api/validate-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (response.ok) {
          setIsLoading(false);
        } 
      } catch (error) {
        console.error('Token validation failed', error);
        navigate('/signin');
      }
    };

    checkTokenValidity();
  }, [navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return children;
};

export default RouteProtection;
