import React, { useEffect, useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import UseContext from '../UseContext';
import UserManagement from './UserManagement';

function UserManagementAccessControl() {
  const [adminAccess, setAdminAccess] = useState(null);
  const [activeAccess, setActiveAccess] = useState(null);
  const { loggedIn, isAdmin, addFlashMessage, checkAdmin, checkActive, setLoggedIn } =
    useContext(UseContext);

  useEffect(() => {
    async function checkAdminAndCheckActive() {
      try {
        const adminRights = await checkAdmin();
        const activeRights = await checkActive();
        setAdminAccess(adminRights);
        setActiveAccess(activeRights);
      } catch (error) {
        console.error('Error during checkAdmin or checkActive:', error);
      }
    }
    checkAdminAndCheckActive();
  }, [isAdmin, loggedIn, checkAdmin, checkActive]);

  useEffect(() => {
    if (adminAccess === null || activeAccess === null) {
      // Data is still being fetched, do not render anything
      return;
    }

    if (!adminAccess) {
      // User is not an admin and not logged in, show flash message
      addFlashMessage('You do not have access to this page.');
    } else if (!activeAccess) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken'); // Remove the session token when log out
    }
  }, [adminAccess, activeAccess, addFlashMessage, loggedIn, setLoggedIn]);

  if (adminAccess === null || activeAccess === null) {
    // Data is still being fetched, do not render anything
    return null;
  }

  return adminAccess && activeAccess && loggedIn ? (
    <UserManagement />
  ) : (
    <Navigate to="/" /> // When the user is not admin nor logged in, block access and navigate to "/"
  );
}

export default UserManagementAccessControl;
