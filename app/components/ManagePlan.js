import React, { useState, useEffect, useContext } from 'react';
import Axios from 'axios';
import UseContext from '../UseContext';
import PlanModal from './PlanModal';

function ManagePlan({
  showManagePlanModal,
  closeManagePlanModal,
  onPlanModalClosed,
  application,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [createPlan, setCreatePlan] = useState('');
  const [editPlan, setEditPlan] = useState(null);
  const { setRefresh, checkProjectManager, checkActive, addFlashMessage, setLoggedIn } =
    useContext(UseContext);

  const fetchPlans = async () => {
    await Axios.get('http://localhost:8080/getPlans')
      .then((response) => {
        setPlans(response.data); // Store user data in applications
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching plans:', error);
        setError('Failed to fetch plans. Please try again later.');
        setLoading(false);
      });
  };

  useEffect(() => {
    setRefresh(true);
    fetchPlans();
  }, []);

  const handlePlanCreatedOrEdited = () => {
    setLoading(true);
    setError(null);
    fetchPlans();
  };

  // Function to open the application modal
  const openPlanModal = () => {
    setShowPlanModal(true);
  };

  // Function to close the application modal
  const closePlanModal = () => {
    onPlanModalClosed();
    setShowPlanModal(false);
  };

  // Function to pass the user details to the edit modal
  const handleEditPlanClick = (plan, userPm, userActive) => {
    if (userPm && userActive) {
      setEditPlan(plan);
      openPlanModal();
      setCreatePlan(false);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!userPm) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to check admin rights first when onclick "Edit"
  async function handleEditPlanClickAccess(plan) {
    const userPm = await checkProjectManager();
    const userActive = await checkActive();
    handleEditPlanClick(plan, userPm, userActive);
  }

  // Function to handle clicking the "Create New Application" button

  const handleCreatePlanClick = (userPm, userActive) => {
    if (userPm && userActive) {
      openPlanModal();
      setCreatePlan(true);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!userPm) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to check admin rights first when onclick "Create New Application"
  async function handleCreatePlanClickAccess() {
    const userPm = await checkProjectManager();
    const userActive = await checkActive();
    handleCreatePlanClick(userPm, userActive);
  }

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center">Error: {error}</div>;
  }

  return (
    showManagePlanModal && (
      <div className="managePlan-overlay">
        <div className="managePlan-content">
          <span className="managePlan-close" onClick={closeManagePlanModal}>
            &times;
          </span>
          <h2 className="managePlan-header">Manage Plans</h2>
          <div className="table-container">
            <table className="table table-bordered plan-table">
              <thead>
                <tr>
                  <th>Plan MVP Name</th>
                  <th>Plan Start Date</th>
                  <th>Plan End Date</th>
                  <th>Plan App Acronym</th>
                  <th>Color Code</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {plans
                  .filter((plan) => plan.Plan_app_Acronym === application)
                  .map((plan) => (
                    <tr key={plan.Plan_MVP_name}>
                      <td>{plan.Plan_MVP_name}</td>
                      <td>{plan.Plan_startDate}</td>
                      <td>{plan.Plan_endDate}</td>
                      <td>{plan.Plan_app_Acronym}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            backgroundColor: plan.Plan_color,
                            width: '45px',
                            height: '45px',
                            display: 'inline-block',
                            borderRadius: '4px',
                          }}
                        ></div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn pageBtns"
                          onClick={() => handleEditPlanClickAccess(plan)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Create and Close Buttons */}
          <div className="text-center">
            <button className="pageBtns btn" onClick={handleCreatePlanClickAccess}>
              Create New Plan
            </button>
            <button className="pageBtns btn ml-2" onClick={closeManagePlanModal}>
              Close
            </button>
          </div>

          {/* Plan Modal */}
          <PlanModal
            showPlanModal={showPlanModal}
            closePlanModal={closePlanModal}
            createPlan={createPlan}
            editPlan={editPlan}
            onPlanCreatedorEdited={handlePlanCreatedOrEdited}
            application={application}
          />
        </div>
      </div>
    )
  );
}
export default ManagePlan;
