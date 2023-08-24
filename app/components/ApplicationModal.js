import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import UseContext from '../UseContext';

function ApplicationModal({
  showApplicationModal,
  closeApplicationModal,
  createApplication,
  editApplication,
  onApplicationCreatedorEdited,
}) {
  const [formData, setFormData] = useState({
    App_Acronym: '',
    App_Rnumber: '',
    App_Description: '',
    App_startDate: '',
    App_endDate: '',
    App_permit_create: '',
    App_permit_Open: '',
    App_permit_toDoList: '',
    App_permit_Doing: '',
    App_permit_Done: '',
  });

  const [userGroups, setUserGroups] = useState([]);
  const { addFlashMessage, setRefresh, checkProjectLead, checkActive, setLoggedIn } =
    useContext(UseContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (createApplication) {
      setFormData({
        App_Acronym: '',
        App_Rnumber: '',
        App_Description: '',
        App_startDate: '',
        App_endDate: '',
        App_permit_create: '',
        App_permit_Open: '',
        App_permit_toDoList: '',
        App_permit_Doing: '',
        App_permit_Done: '',
      });
    } else if (editApplication) {
      setFormData((prevData) => ({
        ...prevData,
        App_Acronym: editApplication.App_Acronym,
        App_Rnumber: editApplication.App_Rnumber,
        App_Description: editApplication.App_Description,
        App_startDate: editApplication.App_startDate,
        App_endDate: editApplication.App_endDate,
        App_permit_create: editApplication.App_permit_create,
        App_permit_Open: editApplication.App_permit_Open,
        App_permit_toDoList: editApplication.App_permit_toDoList,
        App_permit_Doing: editApplication.App_permit_Doing,
        App_permit_Done: editApplication.App_permit_Done,
      }));
    }
  }, [createApplication, editApplication]);

  // Fetch user groups when the component is first mounted
  useEffect(() => {
    fetchUserGroups();
  }, []);

  // Fetch user groups whenever the modal is opened
  useEffect(() => {
    if (showApplicationModal) {
      setRefresh(true);
      fetchUserGroups();
    }
  }, [showApplicationModal]);

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
    const { name, value } = e.target;
    // Update the form data based on the changed field
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    let plAccess = await checkProjectLead();
    let activeAccess = await checkActive();
    if (!plAccess) {
      addFlashMessage('You do not have access to this page.');
      setRefresh(true);
      navigate('/');
    } else if (!activeAccess) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (plAccess && activeAccess) {
      if (createApplication) {
        try {
          const response = await Axios.post('http://localhost:8080/createApplication', {
            App_Acronym: formData.App_Acronym,
            App_Rnumber: formData.App_Rnumber,
            App_Description: formData.App_Description,
            App_startDate: formData.App_startDate,
            App_endDate: formData.App_endDate,
            App_permit_create: formData.App_permit_create,
            App_permit_Open: formData.App_permit_Open,
            App_permit_toDoList: formData.App_permit_toDoList,
            App_permit_Doing: formData.App_permit_Doing,
            App_permit_Done: formData.App_permit_Done,
          });

          if (response.data.success) {
            addFlashMessage(response.data.message);
            onApplicationCreatedorEdited();
            setFormData({
              App_Acronym: '',
              App_Rnumber: '',
              App_Description: '',
              App_startDate: '',
              App_endDate: '',
              App_permit_create: '',
              App_permit_Open: '',
              App_permit_toDoList: '',
              App_permit_Doing: '',
              App_permit_Done: '',
            });
          } else if (!response.data.success) {
            addFlashMessage(response.data.message);
          }
        } catch (e) {
          alert(e);
        }
      } else if (editApplication) {
        try {
          const response = await Axios.post(
            `http://localhost:8080/updateApplication/${editApplication.App_Acronym}`,
            {
              App_Rnumber: formData.App_Rnumber,
              App_Description: formData.App_Description,
              App_startDate: formData.App_startDate,
              App_endDate: formData.App_endDate,
              App_permit_create: formData.App_permit_create,
              App_permit_Open: formData.App_permit_Open,
              App_permit_toDoList: formData.App_permit_toDoList,
              App_permit_Doing: formData.App_permit_Doing,
              App_permit_Done: formData.App_permit_Done,
            }
          );

          if (response.data.success) {
            setFormData({
              ...editApplication,
              App_Acronym: editApplication.App_Acronym,
              App_Rnumber: formData.App_Rnumber,
              App_Description: formData.App_Description,
              App_startDate: formData.App_startDate,
              App_endDate: formData.App_endDate,
              App_permit_create: formData.App_permit_create,
              App_permit_Open: formData.App_permit_Open,
              App_permit_toDoList: formData.App_permit_toDoList,
              App_permit_Doing: formData.App_permit_Doing,
              App_permit_Done: formData.App_permit_Done,
            });
            addFlashMessage(response.data.message);
            onApplicationCreatedorEdited();
            closeApplicationModal();
          } else if (!response.data.success) {
            addFlashMessage(response.data.message);
          }
        } catch (e) {
          alert(e);
        }
      }
    }
  }

  return (
    showApplicationModal && (
      <div className="applicationModal-overlay">
        <div className="applicationModal-content">
          <span className="applicationModal-close" onClick={closeApplicationModal}>
            &times;
          </span>

          <h2 className="applicationModal-header">
            {createApplication ? 'Create New Application' : 'Edit Application'}
          </h2>
          <div className="applicationModal-container">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group col-6" style={{ margin: '5px 0px' }}>
                  <label style={{ margin: '0' }}>Application Acronym</label>
                  <input
                    className="form-control"
                    type="text"
                    name="App_Acronym"
                    value={formData.App_Acronym}
                    onChange={handleChange}
                    required
                    disabled={!createApplication}
                  />
                </div>

                <div className="form-group col-6" style={{ margin: '5px 0px' }}>
                  <label style={{ margin: '0' }}>Application Rnumber</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="1"
                    name="App_Rnumber"
                    value={formData.App_Rnumber}
                    onChange={handleChange}
                    required
                    disabled={!createApplication}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-12" style={{ margin: '-2px 0px' }}>
                  <label style={{ margin: '0' }}>Application Description</label>
                  <textarea
                    className="form-control"
                    name="App_Description"
                    value={formData.App_Description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>Start Date</label>
                  <input
                    className="form-control"
                    type="date"
                    name="App_startDate"
                    value={formData.App_startDate}
                    onChange={handleChange}
                  />
                </div>

                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>End Date</label>
                  <input
                    className="form-control"
                    type="date"
                    name="App_endDate"
                    value={formData.App_endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>Permit Create</label>
                  <select
                    className="form-control"
                    name="App_permit_create"
                    value={formData.App_permit_create}
                    onChange={handleChange}
                  >
                    <option value="">Select a group</option>
                    {userGroups.map((group) => (
                      <option key={group} value={group}>
                        {group.trim()}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>Permit Open</label>
                  <select
                    className="form-control"
                    name="App_permit_Open"
                    value={formData.App_permit_Open}
                    onChange={handleChange}
                  >
                    <option value="">Select a group</option>
                    {userGroups.map((group) => (
                      <option key={group} value={group}>
                        {group.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row ">
                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>Permit To Do</label>
                  <select
                    className="form-control"
                    name="App_permit_toDoList"
                    value={formData.App_permit_toDoList}
                    onChange={handleChange}
                  >
                    <option value="">Select a group</option>
                    {userGroups.map((group) => (
                      <option key={group} value={group}>
                        {group.trim()}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>Permit Doing</label>
                  <select
                    className="form-control"
                    name="App_permit_Doing"
                    value={formData.App_permit_Doing}
                    onChange={handleChange}
                  >
                    <option value="">Select a group</option>
                    {userGroups.map((group) => (
                      <option key={group} value={group}>
                        {group.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="col-3"></div>
                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>Permit Done</label>
                  <select
                    className="form-control"
                    name="App_permit_Done"
                    value={formData.App_permit_Done}
                    onChange={handleChange}
                  >
                    <option value="">Select a group</option>
                    {userGroups.map((group) => (
                      <option key={group} value={group}>
                        {group.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-btn ">
                <button type="submit" className="btn pageBtns col-6">
                  Submit
                </button>

                <button
                  type="button"
                  className="btn pageBtns col-6"
                  onClick={closeApplicationModal}
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
export default ApplicationModal;
