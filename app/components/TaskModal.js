import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import UseContext from '../UseContext';

function TaskModal({
  showTaskModal,
  closeTaskModal,
  createTask,
  editTask,
  viewTask,
  viewOnly,
  promoteTask,
  demoteTask,
  allowChangePlan,
  onTaskCreatedorEdited,
  application,
}) {
  const [formData, setFormData] = useState({
    Task_name: '',
    Task_plan: '',
    Task_description: '',
    Task_notes: [],
    Task_id: '',
    Task_state: '',
    Task_creator: '',
    Task_owner: '',
    Task_createDate: '',
  });

  const [plans, setPlans] = useState([]);
  const { addFlashMessage, setRefresh, checkActive, setLoggedIn } =
    useContext(UseContext);
  const navigate = useNavigate();

  const fetchPlans = async () => {
    await Axios.get('http://localhost:8080/getPlans')
      .then((response) => {
        setPlans(response.data);
      })
      .catch((error) => {
        console.error('Error fetching plans:', error);
      });
  };

  async function fetchPermits(application) {
    try {
      const response = await Axios.get(`http://localhost:8080/getAppData/${application}`);
      if (response.data.success) {
        return {
          createPermit: response.data.create,
          openPermit: response.data.open,
          toDoPermit: response.data.toDo,
          doingPermit: response.data.doing,
          donePermit: response.data.done,
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw new Error('Server Error');
    }
  }

  async function checkGroupPermit(application) {
    try {
      const permits = await fetchPermits(application);

      const groupResponse = await Axios.post('http://localhost:8080/checkGroup', {
        token: sessionStorage.getItem('tmsAppToken'), // Get token to check current user's group
        group: permits.createPermit, // Check against the group permitted
      });

      if (groupResponse.data.success && groupResponse.data.rights) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      addFlashMessage(error.message);
    }
  }

  useEffect(() => {
    if (createTask) {
      setFormData({
        Task_name: '',
        Task_plan: '',
        Task_description: '',
        Task_notes: '',
        Task_id: '',
        Task_state: '',
        Task_creator: '',
        Task_owner: '',
        Task_createDate: '',
      });
    } else if (editTask) {
      setFormData((prevData) => ({
        ...prevData,
        Task_name: editTask.Task_name,
        Task_plan: editTask.Task_plan,
        Task_description: editTask.Task_description,
        Audit_trail: JSON.parse(editTask.Task_notes)
          ['notes'].reverse()
          .map((entry) => {
            return `
          Date: ${entry.Date}
          Activity: ${entry.Activity}
          Task owner: ${entry['Task owner']}
          State: ${entry.State}
          =============================================
          `.replace(/\n/g, '\n'); // Replace newline characters with \n for textarea
          })
          .join(''),
        Task_notes: '',
        Task_id: editTask.Task_id,
        Task_state: editTask.Task_state,
        Task_creator: editTask.Task_creator,
        Task_owner: editTask.Task_owner,
        Task_createDate: editTask.Task_createDate,
      }));
    }
  }, [createTask, editTask]);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (showTaskModal) {
      setRefresh(true);
      fetchPlans();
    }
  }, [showTaskModal]);

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
    let activeAccess = await checkActive();
    if (!activeAccess) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (activeAccess) {
      if (createTask) {
        let hasCreatePermit = await checkGroupPermit(application);
        if (!hasCreatePermit) {
          addFlashMessage('You do not have access to this page.');
          setRefresh(true);
          navigate('/');
        } else {
          try {
            const response = await Axios.post('http://localhost:8080/createTask', {
              Task_name: formData.Task_name,
              Task_plan: formData.Task_plan,
              Task_description: formData.Task_description,
              Task_state: 'Open',
              Task_app_Acronym: application,
              token: sessionStorage.getItem('tmsAppToken'),
            });
            if (response.data.success) {
              addFlashMessage(response.data.message);
              onTaskCreatedorEdited();
              setFormData({
                Task_name: '',
                Task_plan: '',
                Task_description: '',
                Task_notes: '',
                Task_id: '',
                Task_state: '',
                Task_creator: '',
                Task_owner: '',
                Task_createDate: '',
              });
            } else if (!response.data.success) {
              addFlashMessage(response.data.message);
            }
          } catch (e) {
            alert(e);
          }
        }
      } else if (editTask && !promoteTask && !demoteTask) {
        try {
          const response = await Axios.post('http://localhost:8080/updateTask', {
            Task_name: formData.Task_name,
            Task_plan: formData.Task_plan,
            Task_notes: formData.Task_notes,
            Task_id: formData.Task_id,
            Task_state: formData.Task_state,
            token: sessionStorage.getItem('tmsAppToken'),
            Task_app_Acronym: application,
          });

          if (response.data.success) {
            setFormData({
              ...editTask,
              Task_name: formData.Task_name,
              Task_plan: formData.Task_plan,
              Task_description: formData.Task_description,
              Audit_trail: JSON.parse(editTask.Task_notes)
                ['notes'].reverse()
                .map((entry) => {
                  return `
          Date: ${entry.Date}
          Activity: ${entry.Activity}
          Task owner: ${entry['Task owner']}
          State: ${entry.State}
          =============================================
          `.replace(/\n/g, '\n'); // Replace newline characters with \n for textarea
                })
                .join(''),
              Task_notes: '',
              Task_id: formData.Task_id,
              Task_state: formData.Task_state,
              Task_creator: formData.Task_creator,
              Task_owner: formData.Task_owner,
              Task_createDate: formData.Task_createDate,
            });
            addFlashMessage(response.data.message);
            onTaskCreatedorEdited();
            closeTaskModal();
          }
        } catch (e) {
          alert(e);
        }
      } else if (editTask && promoteTask) {
        try {
          const response = await Axios.post('http://localhost:8080/promoteTask', {
            Task_name: formData.Task_name,
            Task_plan: formData.Task_plan,
            Task_notes: formData.Task_notes,
            Task_id: formData.Task_id,
            Task_state: formData.Task_state,
            token: sessionStorage.getItem('tmsAppToken'),
            Task_app_Acronym: application,
          });

          if (response.data.success) {
            setFormData({
              ...editTask,
              Task_name: formData.Task_name,
              Task_plan: formData.Task_plan,
              Task_description: formData.Task_description,
              Audit_trail: JSON.parse(editTask.Task_notes)
                ['notes'].reverse()
                .map((entry) => {
                  return `
          Date: ${entry.Date}
          Activity: ${entry.Activity}
          Task owner: ${entry['Task owner']}
          State: ${entry.State}
          =============================================
          `.replace(/\n/g, '\n'); // Replace newline characters with \n for textarea
                })
                .join(''),
              Task_notes: '',
              Task_id: formData.Task_id,
              Task_state: formData.Task_state,
              Task_creator: formData.Task_creator,
              Task_owner: formData.Task_owner,
              Task_createDate: formData.Task_createDate,
            });
            addFlashMessage(response.data.message);
            onTaskCreatedorEdited();
            closeTaskModal();
          }
        } catch (e) {
          alert(e);
        }
      } else if (editTask && demoteTask) {
        try {
          const response = await Axios.post('http://localhost:8080/demoteTask', {
            Task_name: formData.Task_name,
            Task_plan: formData.Task_plan,
            Task_notes: formData.Task_notes,
            Task_id: formData.Task_id,
            Task_state: formData.Task_state,
            token: sessionStorage.getItem('tmsAppToken'),
            Task_app_Acronym: application,
          });

          if (response.data.success) {
            setFormData({
              ...editTask,
              Task_name: formData.Task_name,
              Task_plan: formData.Task_plan,
              Task_description: formData.Task_description,
              Audit_trail: JSON.parse(editTask.Task_notes)
                ['notes'].reverse()
                .map((entry) => {
                  return `
          Date: ${entry.Date}
          Activity: ${entry.Activity}
          Task owner: ${entry['Task owner']}
          State: ${entry.State}
          =============================================
          `.replace(/\n/g, '\n'); // Replace newline characters with \n for textarea
                })
                .join(''),
              Task_notes: '',
              Task_id: formData.Task_id,
              Task_state: formData.Task_state,
              Task_creator: formData.Task_creator,
              Task_owner: formData.Task_owner,
              Task_createDate: formData.Task_createDate,
            });
            addFlashMessage(response.data.message);
            onTaskCreatedorEdited();
            closeTaskModal();
          }
        } catch (e) {
          alert(e);
        }
      }
    }
  }

  return (
    showTaskModal && (
      <div className="taskModal-overlay">
        <div className="taskModal-content">
          <form style={{ width: '100%' }} onSubmit={handleSubmit}>
            <span className="taskModal-close" onClick={closeTaskModal}>
              &times;
            </span>
            <div className="form-row">
              <span className="col-1"></span>
              <h2 className="col-10 taskModal-header">
                {createTask ? 'Create New Task' : viewTask ? 'View Task' : 'Edit Task'}
              </h2>
            </div>

            <div className="form-row">
              <div
                className={`form-group ${createTask ? 'col-6' : 'col-4'}`}
                style={{ margin: '2px 0px' }}
              >
                <label style={{ margin: '0' }}>Task Name</label>
                <input
                  className="form-control"
                  type="text"
                  name="Task_name"
                  value={formData.Task_name}
                  onChange={handleChange}
                  required
                  readOnly={!createTask || viewOnly}
                />
              </div>
              {!createTask && (
                <div className="form-group col-4" style={{ margin: '2px 0px' }}>
                  <label style={{ margin: '0' }}>Task ID</label>
                  <input
                    className="form-control"
                    type="text"
                    name="Task_id"
                    value={formData.Task_id}
                    onChange={handleChange}
                    readOnly={!createTask || viewOnly} //dont show unless edit (read-only)
                  />
                </div>
              )}
              <div
                className={`form-group ${createTask ? 'col-6' : 'col-4'}`}
                style={{ margin: '2px 0px' }}
              >
                <label style={{ margin: '0' }}>Task Plan</label>
                <select
                  className="form-control"
                  name="Task_plan"
                  value={formData.Task_plan}
                  onChange={handleChange}
                  disabled={!allowChangePlan || viewOnly}
                >
                  <option value="">Select Task Plan</option>
                  {plans
                    .filter((plan) => plan.Plan_app_Acronym === application)
                    .map((plan) => (
                      <option key={plan.Plan_MVP_name} value={plan.Plan_MVP_name}>
                        {plan.Plan_MVP_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-12" style={{ margin: '2px 0px' }}>
                <label style={{ margin: '0' }}>Task Description</label>
                <textarea
                  className="form-control"
                  name="Task_description"
                  value={formData.Task_description}
                  style={{ minHeight: '75px' }}
                  onChange={handleChange}
                  readOnly={!createTask || viewOnly}
                />
              </div>
            </div>

            <div className="form-row">
              {!createTask && (
                <div className="form-group col-12" style={{ margin: '2px 0px' }}>
                  <label style={{ margin: '0' }}>Audit Trail</label>
                  <textarea
                    className="form-control"
                    name="Audit_trail"
                    value={formData.Audit_trail}
                    style={{ minHeight: '100px' }}
                    readOnly
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              {!createTask && (
                <div className="form-group col-12" style={{ margin: '2px 0px' }}>
                  <label style={{ margin: '0' }}>Task notes</label>
                  <textarea
                    className="form-control"
                    name="Task_notes"
                    value={formData.Task_notes}
                    onChange={handleChange}
                    readOnly={viewOnly}
                    //dont show unless edit (let user edit)
                  />
                </div>
              )}
            </div>

            <div className="form-row" style={{ marginBottom: '10px' }}>
              {!createTask && (
                <div className="form-group col-3" style={{ margin: '2px 0px' }}>
                  <label style={{ margin: '0' }}>Task State</label>
                  <input
                    className="form-control"
                    type="text"
                    name="Task_state"
                    value={formData.Task_state}
                    onChange={handleChange}
                    readOnly={!createTask || viewOnly}
                    //dont show unless edit (read-only)
                  />
                </div>
              )}
              {!createTask && (
                <div className="form-group col-3" style={{ margin: '2px 0px' }}>
                  <label style={{ margin: '0' }}>Task Creator</label>
                  <input
                    className="form-control"
                    type="text"
                    name="Task_creator"
                    value={formData.Task_creator}
                    onChange={handleChange}
                    readOnly={!createTask || viewOnly}
                    //dont show unless edit (read-only)
                  />
                </div>
              )}
              {!createTask && (
                <div className="form-group col-3" style={{ margin: '2px 0px' }}>
                  <label style={{ margin: '0' }}>Task Owner</label>
                  <input
                    className="form-control"
                    type="text"
                    name="Task_owner"
                    value={formData.Task_owner}
                    onChange={handleChange}
                    readOnly={!createTask || viewOnly}
                    //dont show unless edit (read-only)
                  />
                </div>
              )}
              {!createTask && (
                <div className="form-group col-3" style={{ margin: '2px 0px' }}>
                  <label style={{ margin: '0' }}>Task Create Date</label>
                  <input
                    className="form-control"
                    type="text"
                    name="Task_createDate"
                    value={formData.Task_createDate}
                    onChange={handleChange}
                    readOnly={!createTask || viewOnly}
                    //dont show unless edit (read-only)
                  />
                </div>
              )}
            </div>

            <div className="form-row" style={{ justifyContent: 'space-evenly' }}>
              {!viewOnly && (
                <button
                  type="submit"
                  className="btn pageBtns col-6"
                  style={{ maxWidth: '10em' }}
                >
                  {promoteTask ? 'Promote' : demoteTask ? 'Demote' : 'Submit'}
                </button>
              )}
              {viewOnly ? (
                <div className="col-12 d-flex align-items-center justify-content-center">
                  <button
                    type="button"
                    className="btn pageBtns"
                    style={{ minWidth: '15em' }}
                    onClick={closeTaskModal}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn pageBtns col-6"
                  style={{ maxWidth: '10em' }}
                  onClick={closeTaskModal}
                >
                  Close
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    )
  );
}

export default TaskModal;
