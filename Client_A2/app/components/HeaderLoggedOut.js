import React, { useEffect, useState, useContext } from 'react';
import Axios from 'axios';
import UseContext from '../UseContext';

function HeaderLoggedOut() {
  const { setLoggedIn, addFlashMessage, username, setUsername, password, setPassword } =
    useContext(UseContext);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await Axios.post('http://localhost:8080/login', {
        username: username,
        password: password,
      });
      if (response.data.success) {
        const token = response.data.token;
        sessionStorage.setItem('tmsAppToken', token);
        addFlashMessage(response.data.message);
        setLoggedIn(true);
      } else if (!response.data.success && response.data.notActive) {
        addFlashMessage(response.data.message);
      } else if (!response.data.success) {
        addFlashMessage(response.data.message);
      } else {
        addFlashMessage(response.data.message);
      }
    } catch (e) {
      addFlashMessage('Network Error.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-0 pt-2 pt-md-0">
      <div className="row align-items-center">
        <div className="col-md mr-0 pr-md-0 mb-3 mb-md-0">
          <input
            onChange={(e) => setUsername(e.target.value)}
            name="username"
            className="login-input-fields form-control form-control-sm input-white"
            type="text"
            placeholder="Username"
            autoComplete="off"
          />
        </div>
        <div className="col-md mr-0 pr-md-0 mb-3 mb-md-0">
          <input
            onChange={(e) => setPassword(e.target.value)}
            name="password"
            className="login-input-fields form-control form-control-sm input-white"
            type="password"
            placeholder="Password"
          />
        </div>
        <div className="col-md-auto">
          <button className="btn btn-sm" id="signIn-btn">
            Sign In
          </button>
        </div>
      </div>
    </form>
  );
}

export default HeaderLoggedOut;
