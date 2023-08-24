import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import UseContext from '../UseContext';

function HeaderLoggedIn() {
  const { setLoggedIn, isAdmin, checkAdmin, addFlashMessage, checkActive, setRefresh } =
    useContext(UseContext);
  const navigate = useNavigate();

  function handleLogout() {
    setLoggedIn(false);
    sessionStorage.removeItem('tmsAppToken'); // Remove the session token when log out
    addFlashMessage('You have successfully logged out.');
  }

  async function handleManagementAccess() {
    const adminAccess = await checkAdmin();
    const activeAccess = await checkActive();
    if (adminAccess && activeAccess) {
      navigate('/user-management');
    } else if (!activeAccess) {
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
      addFlashMessage('Your account has been disabled');
    } else {
      navigate('/');
      addFlashMessage('No access');
      setRefresh(true);
    }
  }

  async function handleUserProfileAccess() {
    const activeAccess = await checkActive();
    if (activeAccess) {
      navigate('/profile');
    } else if (!activeAccess) {
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
      addFlashMessage('Your account has been disabled');
    }
  }

  return (
    <div className="flex-row my-3 my-md-0">
      {isAdmin && ( // Render the button only if the user is an admin
        <button
          className="btn btn-sm mr-2"
          id="header-btns"
          onClick={handleManagementAccess}
        >
          User Management
        </button>
      )}
      <button
        className="btn btn-sm mr-2"
        id="header-btns"
        onClick={handleUserProfileAccess}
      >
        Profile
      </button>
      <button onClick={handleLogout} className="btn btn-sm" id="header-btns">
        Sign Out
      </button>
    </div>
  );
}

export default HeaderLoggedIn;
