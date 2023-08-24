import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import UseContext from '../UseContext';

function PlanModal({
  showPlanModal,
  closePlanModal,
  createPlan,
  editPlan,
  onPlanCreatedorEdited,
  application,
}) {
  const [formData, setFormData] = useState({
    Plan_MVP_name: '',
    Plan_startDate: '',
    Plan_endDate: '',
    Plan_app_Acronym: application,
  });
  const [planColor, setPlanColor] = useState('#FFFFFF');
  const { addFlashMessage, setRefresh, checkProjectManager, checkActive, setLoggedIn } =
    useContext(UseContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (createPlan) {
      setFormData({
        Plan_MVP_name: '',
        Plan_startDate: '',
        Plan_endDate: '',
        Plan_app_Acronym: application,
      });
    } else if (editPlan) {
      setFormData((prevData) => ({
        ...prevData,
        Plan_MVP_name: editPlan.Plan_MVP_name,
        Plan_startDate: editPlan.Plan_startDate,
        Plan_endDate: editPlan.Plan_endDate,
        Plan_app_Acronym: editPlan.Plan_app_Acronym,
      }));
      setPlanColor(editPlan.Plan_color);
    }
  }, [createPlan, editPlan]);

  useEffect(() => {
    setRefresh(true);
  }, []);

  useEffect(() => {
    if (showPlanModal) {
      setRefresh(true);
    }
  }, [showPlanModal]);

  // Function to handle changes in the form fields
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
    let pmAccess = await checkProjectManager();
    let activeAccess = await checkActive();
    if (!pmAccess) {
      addFlashMessage('You do not have access to this page.');
      setRefresh(true);
      navigate('/');
    } else if (!activeAccess) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (pmAccess && activeAccess) {
      if (createPlan) {
        try {
          const response = await Axios.post('http://localhost:8080/createPlan', {
            Plan_MVP_name: formData.Plan_MVP_name,
            Plan_startDate: formData.Plan_startDate,
            Plan_endDate: formData.Plan_endDate,
            Plan_app_Acronym: formData.Plan_app_Acronym,
            Plan_color: planColor,
          });

          if (response.data.success) {
            addFlashMessage(response.data.message);
            onPlanCreatedorEdited();
            setFormData({
              Plan_MVP_name: '',
              Plan_startDate: '',
              Plan_endDate: '',
              Plan_app_Acronym: application,
            });
          } else if (!response.data.success) {
            addFlashMessage(response.data.message);
          }
        } catch (e) {
          alert(e);
        }
      } else if (editPlan) {
        try {
          const response = await Axios.post(
            `http://localhost:8080/updatePlan/${editPlan.Plan_MVP_name}`,
            {
              Plan_MVP_name: formData.Plan_MVP_name,
              Plan_startDate: formData.Plan_startDate,
              Plan_endDate: formData.Plan_endDate,
              Plan_app_Acronym: formData.Plan_app_Acronym,
              Plan_color: planColor,
            }
          );

          if (response.data.success) {
            setFormData({
              ...editPlan,
              Plan_MVP_name: editPlan.Plan_MVP_name,
              Plan_startDate: formData.Plan_startDate,
              Plan_endDate: formData.Plan_endDate,
              Plan_app_Acronym: formData.Plan_app_Acronym,
            });
            addFlashMessage(response.data.message);
            onPlanCreatedorEdited();
            closePlanModal();
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
    showPlanModal && (
      <div className="planModal-overlay">
        <div className="planModal-content">
          <span className="planModal-close" onClick={closePlanModal}>
            &times;
          </span>

          <h2 className="planModal-header">
            {createPlan ? 'Create New Plan' : 'Edit Plan'}
          </h2>
          <div className="planModal-container">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group col-6" style={{ margin: '5px 0px' }}>
                  <label style={{ margin: '0' }}>Plan MVP Name</label>
                  <input
                    className="form-control"
                    type="text"
                    name="Plan_MVP_name"
                    value={formData.Plan_MVP_name}
                    onChange={handleChange}
                    required
                    disabled={!createPlan}
                  />
                </div>

                <div className="form-group col-6" style={{ margin: '5px 0px' }}>
                  <label style={{ margin: '0' }}>Plan App Acronym</label>
                  <input
                    className="form-control"
                    type="text"
                    name="Plan_app_Acronym"
                    value={formData.Plan_app_Acronym}
                    onChange={handleChange}
                    disabled
                  />
                </div>
              </div>

              <div className="form-row">
                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>Plan Start Date</label>
                  <input
                    className="form-control"
                    type="date"
                    name="Plan_startDate"
                    value={formData.Plan_startDate}
                    onChange={handleChange}
                  />
                </div>

                <div
                  className="form-group col-6 center-cols"
                  style={{ margin: '-2px 0px' }}
                >
                  <label style={{ margin: '0' }}>Plan End Date</label>
                  <input
                    className="form-control"
                    type="date"
                    name="Plan_endDate"
                    value={formData.Plan_endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div
                className="form-group col-12 center-cols text-center"
                style={{ margin: '-2px 0px' }}
              >
                <label style={{ margin: '0' }}>Plan Color Code</label>
                <input
                  type="color"
                  name="Plan_color"
                  value={planColor}
                  onChange={(e) => setPlanColor(e.target.value)}
                />
              </div>

              <div className="form-row-btn ">
                <button type="submit" className="btn pageBtns col-6">
                  Submit
                </button>

                <button
                  type="button"
                  className="btn pageBtns col-6"
                  onClick={closePlanModal}
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
export default PlanModal;
