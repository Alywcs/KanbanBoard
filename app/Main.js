import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Axios from 'axios';

// My Components
import Header from './components/Header';
import Home from './components/Home';
import LoginFormPage from './components/LoginFormPage';
import Footer from './components/Footer';
import UserManagementAccessControl from './components/UserManagementAccessControl';
import UseContext from './UseContext';
import FlashMessages from './components/FlashMessages';
import Profile from './components/Profile';

function Main() {
  const [loggedIn, setLoggedIn] = useState(
    Boolean(sessionStorage.getItem('tmsAppToken'))
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [flashMessages, setFlashMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [refresh, setRefresh] = useState(true);

  async function checkAdmin() {
    if (loggedIn) {
      try {
        const response = await Axios.post('http://localhost:8080/checkGroup', {
          token: sessionStorage.getItem('tmsAppToken'),
          group: 'admin',
        });
        if (response.data.success) {
          setIsAdmin(response.data.rights);
          return true;
        } else if (!response.data.success) {
          setIsAdmin(response.data.rights);
          return false;
        }
      } catch (error) {
        addFlashMessage('Timeout, please log in again.');
        return false;
      }
    } else {
      setIsAdmin(false);
      return false;
    }
  }

  async function checkActive() {
    if (loggedIn) {
      try {
        const response = await Axios.post('http://localhost:8080/checkActive', {
          token: sessionStorage.getItem('tmsAppToken'),
        });
        if (response.data.success) {
          return true;
        } else if (!response.data.success) {
          return false;
        }
      } catch (error) {
        addFlashMessage('Your account has been disabled.');
        return false;
      }
    } else {
      return false;
    }
  }

  // Call the checkAdmin function inside the useEffect
  useEffect(() => {
    checkAdmin();
    checkActive();
    setRefresh(false);
  }, [refresh, loggedIn]);

  function addFlashMessage(msg) {
    setFlashMessages((prev) => prev.concat(msg));
  }

  return (
    <UseContext.Provider
      value={{
        setLoggedIn,
        addFlashMessage,
        loggedIn,
        isAdmin,
        username,
        setUsername,
        password,
        setPassword,
        checkAdmin,
        checkActive,
        setRefresh,
        refresh,
      }}
    >
      <BrowserRouter>
        <FlashMessages messages={flashMessages} />
        <Header />
        <Routes>
          <Route path="/" element={loggedIn ? <Home /> : <LoginFormPage />} />
          <Route path="/user-management" element={<UserManagementAccessControl />} />
          <Route path="/profile" element={loggedIn ? <Profile /> : <LoginFormPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </UseContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.querySelector('#app'));
root.render(<Main />);

if (module.hot) {
  module.hot.accept();
}
