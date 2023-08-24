import React, { useEffect, useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import UseContext from '../UseContext';
import KanbanBoard from './KanbanBoard';

function KanbanBoardAccessControl() {
  const [activeAccess, setActiveAccess] = useState(null);
  const { loggedIn, addFlashMessage, checkActive, setLoggedIn } = useContext(UseContext);

  useEffect(() => {
    async function checkUserActive() {
      try {
        const activeRights = await checkActive();
        setActiveAccess(activeRights);
      } catch (error) {
        console.error('Error during checkActive:', error);
      }
    }
    checkUserActive();
  }, [loggedIn, checkActive]);

  useEffect(() => {
    if (activeAccess === null) {
      // Data is still being fetched, do not render anything
      return;
    }

    if (!loggedIn) {
      // User is not logged in, show flash message
      addFlashMessage('You do not have access to this page.');
    } else if (!activeAccess) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken'); // Remove the session token when log out
    }
  }, [activeAccess, addFlashMessage, loggedIn, setLoggedIn]);

  if (activeAccess === null) {
    // Data is still being fetched, do not render anything
    return null;
  }

  return activeAccess && loggedIn ? (
    <KanbanBoard />
  ) : (
    <Navigate to="/" /> // When the user is not admin nor logged in, block access and navigate to "/"
  );
}

export default KanbanBoardAccessControl;
