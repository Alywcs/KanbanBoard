import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from './Page';
import UseContext from '../UseContext';
import Axios from 'axios';
import ApplicationModal from './ApplicationModal';

function Home() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [createApplication, setCreateApplication] = useState('');
  const [editApplication, setEditApplication] = useState('');
  const {
    username,
    isProjectLead,
    setLoggedIn,
    addFlashMessage,
    checkActive,
    checkProjectLead,
    setRefresh,
  } = useContext(UseContext);
  const navigate = useNavigate();

  const fetchApplications = async () => {
    await Axios.get('http://localhost:8080/getApplications')
      .then((response) => {
        setApplications(response.data); // Store user data in applications
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching applications:', error);
        setError('Failed to fetch applications. Please try again later.');
        setLoading(false);
      });
  };

  useEffect(() => {
    setRefresh(true);
    fetchApplications();
  }, []);

  const handleApplicationCreatedOrEdited = () => {
    setLoading(true);
    setError(null);
    fetchApplications();
  };

  // Function to open the application modal
  const openApplicationModal = () => {
    setShowApplicationModal(true);
  };

  // Function to close the application modal
  const closeApplicationModal = () => {
    setShowApplicationModal(false);
  };

  // Function to pass the user details to the edit modal
  const handleEditApplicationClick = (application, userPl, userActive) => {
    if (userPl && userActive) {
      setEditApplication(application);
      openApplicationModal();
      setCreateApplication(false);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!userPl) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to check admin rights first when onclick "Edit"
  async function handleEditApplicationClickAccess(application) {
    const userPl = await checkProjectLead();
    const userActive = await checkActive();
    handleEditApplicationClick(application, userPl, userActive);
  }

  // Function to handle clicking the "Create New Application" button

  const handleCreateApplicationClick = (userPl, userActive) => {
    if (userPl && userActive) {
      openApplicationModal();
      setCreateApplication(true);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!userPl) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to check admin rights first when onclick "Create New Application"
  async function handleCreateApplicationClickAccess() {
    const userPl = await checkProjectLead();
    const userActive = await checkActive();
    handleCreateApplicationClick(userPl, userActive);
  }

  // Function to handle clicking the "App_Acronym" button
  const handleApplicationClick = (application, userActive) => {
    if (userActive) {
      navigate(`/kanban-board/${application.App_Acronym}`);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    }
  };

  // Function to check admin rights first when onclick "Create New Application"
  async function handleApplicationAccess(application) {
    const userActive = await checkActive();
    handleApplicationClick(application, userActive);
  }

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center">Error: {error}</div>;
  }

  return (
    <Page title="Home">
      <div>
        <h2 className="text-center">
          Hello <strong>{username}</strong>, there are {applications.length}{' '}
          application(s).
        </h2>

        {isProjectLead && (
          <button className="btn pageBtns" onClick={handleCreateApplicationClickAccess}>
            Create New Application
          </button>
        )}

        <div className="application-container">
          {/* Render the list of applications here */}
          {applications.map((application) => (
            <div
              key={application.App_Acronym}
              className="row application-row mb-3"
              style={{ justifyContent: 'space-between' }}
            >
              <div className="application-body col-8">
                <button
                  className="application-title"
                  style={{ outline: 'none' }}
                  onClick={() => handleApplicationAccess(application)}
                >
                  {application.App_Acronym}
                </button>
                <p className="application-desc text-truncate">
                  {application.App_Description != null || ''
                    ? `${application.App_Description}`
                    : '-'}
                </p>
              </div>
              <div className="col-3 application-others">
                {application.App_startDate != null && (
                  <div>Start Date: {application.App_startDate}</div>
                )}
                {application.App_endDate != null && (
                  <div>End Date: {application.App_endDate}</div>
                )}
              </div>
              <div className="col-1 application-others">
                <button
                  className="btn pageBtns"
                  onClick={() => handleEditApplicationClickAccess(application)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
        <ApplicationModal
          showApplicationModal={showApplicationModal}
          closeApplicationModal={closeApplicationModal}
          createApplication={createApplication}
          editApplication={editApplication}
          onApplicationCreatedorEdited={handleApplicationCreatedOrEdited}
        />
      </div>
    </Page>
  );
}

export default Home;
