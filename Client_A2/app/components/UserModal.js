import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import UseContext from '../UseContext';

function UserModal({
  showUserModal,
  closeUserModal,
  createUser,
  editUser,
  onUserCreatedorEdited,
}) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    isActive: true,
    group: [],
  });
  const [userGroups, setUserGroups] = useState([]);
  const { addFlashMessage, setRefresh, checkAdmin, checkActive, setLoggedIn } =
    useContext(UseContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (createUser) {
      setFormData({
        username: '',
        password: '',
        email: '',
        isActive: true,
        group: [],
      });
    } else if (editUser) {
      setFormData((prevData) => ({
        ...prevData,
        username: editUser.username,
        password: '',
        email: editUser.email,
        isActive: editUser.isActive == 1 ? true : false,
        group: editUser.group
          ? editUser.group.split(',').map((group) => group.trim())
          : [],
      }));
    }
  }, [createUser, editUser]);

  // Fetch user groups when the component is first mounted
  useEffect(() => {
    fetchUserGroups();
  }, []);

  // Fetch user groups whenever the modal is opened
  useEffect(() => {
    if (showUserModal) {
      setRefresh(true);
      fetchUserGroups();
    }
  }, [showUserModal]);

  const fetchUserGroups = () => {
    Axios.get('http://localhost:8080/getUserGroups')
      .then((response) => {
        const groupNames = response.data.map((group) => group.group_name);
        setUserGroups(groupNames);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
      });
  };

  // Function to handle changes in the form fields apart from user groups
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Update the form data based on the changed field
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Function to handle selection of user groups
  const handleGroupSelect = (group) => {
    // If the username is "admin", do not allow adding/removing the "admin" group
    if (formData.username === 'admin' && group === 'admin') {
      return;
    }

    // Format the group name by removing leading and trailing spaces
    const formattedGroup = group.trim();
    // Create a regex to match the exact group name within the array
    const groupRegex = new RegExp(`^\\.${formattedGroup}\\.$`);
    // Check if the group is already in the array
    const groupIndex = formData.group.findIndex((g) => groupRegex.test(g));

    if (groupIndex !== -1) {
      // Group is already selected, so remove it from the list
      const updatedGroup = [...formData.group];
      updatedGroup.splice(groupIndex, 1);
      // Update the form data with the modified group array
      setFormData((prevData) => ({
        ...prevData,
        group: updatedGroup,
      }));
    } else {
      // Group is not selected, so add it to the list
      setFormData((prevData) => ({
        ...prevData,
        group: [...prevData.group, `.${formattedGroup}.`],
      }));
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    let adminAccess = await checkAdmin();
    let activeAccess = await checkActive();
    if (!adminAccess) {
      addFlashMessage('You do not have access to this page.');
      setRefresh(true);
      navigate('/');
    } else if (!activeAccess) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (adminAccess && activeAccess) {
      if (createUser) {
        try {
          const response = await Axios.post('http://localhost:8080/createUser', {
            username: formData.username,
            password: formData.password,
            email: formData.email,
            group: formData.group,
            isActive: formData.isActive,
          });

          if (response.data.success) {
            addFlashMessage(response.data.message);
            onUserCreatedorEdited();
            setFormData({
              username: '',
              password: '',
              email: '',
              isActive: true,
              group: [],
            });
          } else if (!response.data.success) {
            addFlashMessage(response.data.message);
          }
        } catch (e) {
          alert(e);
        }
      } else if (editUser) {
        try {
          const response = await Axios.post(
            `http://localhost:8080/updateUser/${editUser.username}`,
            {
              password: formData.password,
              email: formData.email,
              group: formData.group,
              isActive: formData.isActive,
            }
          );

          if (response.data.success) {
            setFormData({
              ...editUser,
              username: editUser.username,
              email: formData.email,
              isActive: formData.isActive,
              group: formData.group,
            });
            addFlashMessage(response.data.message);
            onUserCreatedorEdited();
            closeUserModal();
          } else if (!response.data.success && response.data.existingEmail) {
            addFlashMessage(response.data.message);
          }
        } catch (e) {
          alert(e);
        }
      }
    }
  }

  return (
    showUserModal && (
      <div className="userModal-overlay">
        <div className="userModal-content">
          <span className="userModal-close" onClick={closeUserModal}>
            &times;
          </span>

          <h2 className="userModal-header">
            {createUser ? 'Create New User' : 'Edit User'}
          </h2>
          <div className="userModal-container">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group col-6">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    pattern="^([a-zA-Z0-9]){3,12}$"
                    title="Invalid Username. Username must be 3 to 12 characters long and comprise alphanumeric only."
                    disabled={!createUser}
                  />
                </div>

                <div className="form-group col-6">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={createUser}
                    pattern="^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,10}$"
                    title="Invalid Password. Password must be 8 to 10 characters long and comprise alphanumeric and special characters."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email ? formData.email : ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Groups</label>
                <div className="group-list-container">
                  <div className="group-list">
                    {userGroups.map((group) => (
                      <div key={group} className="group-item">
                        <label>
                          <input
                            type="checkbox"
                            name="group"
                            value={group ? formData.group : ''}
                            checked={formData.group.includes(`.${group.trim()}.`)}
                            onChange={() => handleGroupSelect(group)}
                            disabled={formData.username === 'admin' && group === 'admin'}
                          />
                          {group.trim()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group checkbox-isActive">
                <label>Is Active</label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  disabled={formData.username == 'admin'}
                />
              </div>
              <div className="form-row-btn ">
                <button type="submit" className="btn pageBtns col-6">
                  Submit
                </button>

                <button
                  type="button"
                  className="btn pageBtns col-6"
                  onClick={closeUserModal}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );
}

export default UserModal;
