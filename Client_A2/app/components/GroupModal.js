// GroupModal.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import UseContext from '../UseContext';

function GroupModal({ showGroupModal, closeGroupModal, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const { addFlashMessage, checkAdmin, checkActive, setLoggedIn, setRefresh } =
    useContext(UseContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showGroupModal || onGroupCreated) {
      setGroupName('');
    }
  }, [showGroupModal, onGroupCreated]);

  const handleChange = (e) => {
    const { value } = e.target;
    setGroupName(value);
  };

  const handleSubmit = async (e) => {
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
      try {
        const response = await Axios.post('http://localhost:8080/createGroup', {
          groupName,
        });

        if (response.data.success) {
          addFlashMessage(response.data.message);
          onGroupCreated();
          closeGroupModal();
        } else if (!response.data.success) {
          addFlashMessage(response.data.message);
        }
      } catch (error) {
        addFlashMessage('Failed to create group, group already existed');
      }
    }
  };

  return (
    showGroupModal && (
      <div className="groupModal-overlay">
        <div className="groupModal-content">
          <span className="groupModal-close" onClick={closeGroupModal}>
            &times;
          </span>

          <h2 className="groupModal-header">Create New Group</h2>
          <div className="groupModal-container">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  name="groupName"
                  value={groupName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-row-btn">
                <button type="submit" className="btn pageBtns col-6">
                  Create Group
                </button>
                <button
                  type="button"
                  className="btn pageBtns col-6"
                  onClick={closeGroupModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );
}

export default GroupModal;
