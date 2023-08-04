import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import Page from './Page';
import UseContext from '../UseContext';

function Profile() {
  const [formData, setFormData] = useState({
    newPassword: '',
    newEmail: '',
  });

  const { checkActive, addFlashMessage, setLoggedIn, setRefresh } =
    useContext(UseContext);
  const navigate = useNavigate();

  useEffect(() => {
    setFormData({
      newPassword: '',
      newEmail: '',
    });
  }, []);

  const goBack = async () => {
    let activeAccess = await checkActive();
    if (!activeAccess) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else {
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to handle changes in the form fields apart from user groups
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update the form data based on the changed field
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let activeAccess = await checkActive();
    if (!activeAccess) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
      return;
    } else {
      try {
        const response = await Axios.post('http://localhost:8080/updateOwnDetails', {
          token: sessionStorage.getItem('tmsAppToken'),
          password: formData.newPassword,
          email: formData.newEmail,
        });
        if (response.data.success) {
          addFlashMessage(response.data.message);
          navigate('/');
        } else if (!response.data.success) {
          addFlashMessage(response.data.message);
        }
      } catch (e) {
        alert(e);
      }
    }
    // Your code to update the password and email
    // For simplicity, I'm just logging the values here
    console.log('New Password:', formData.newPassword);
    console.log('New Email:', formData.newEmail);
  };

  return (
    <Page title="User Profile">
      <div className="page-container">
        <div className="container">
          <h1 className="text-center page-header">USER PROFILE</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                pattern="^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,10}$"
                title="Invalid Password. Password must be 8 to 10 characters long and comprise alphanumeric and special characters."
              />
            </div>
            <div className="form-group">
              <label>New Email</label>
              <input
                type="email"
                name="newEmail"
                value={formData.newEmail}
                onChange={handleChange}
              />
            </div>
            <div className="form-row-btn">
              <button type="submit" className="btn pageBtns col-6">
                Update
              </button>
              <button type="button" onClick={goBack} className="btn pageBtns col-6">
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </Page>
  );
}

export default Profile;
