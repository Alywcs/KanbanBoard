import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Axios from 'axios';
import UseContext from '../UseContext';
import TaskModal from './TaskModal';
import ManagePlan from './ManagePlan';

function KanbanBoard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [createTask, setCreateTask] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [viewTask, setViewTask] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [allowChangePlan, setAllowChangePlan] = useState(false);
  const [promoteTask, setPromoteTask] = useState(false);
  const [demoteTask, setDemoteTask] = useState(false);
  const [shouldRenderCreateTaskButton, setShouldRenderCreateTaskButton] = useState(false);
  const [shouldRenderOpenArrows, setShouldRenderOpenArrows] = useState(false);
  const [shouldRenderToDoArrows, setShouldRenderToDoArrows] = useState(false);
  const [shouldRenderDoingArrows, setShouldRenderDoingArrows] = useState(false);
  const [shouldRenderDoneArrows, setShouldRenderDoneArrows] = useState(false);

  const {
    setRefresh,
    isProjectManager,
    checkProjectManager,
    checkActive,
    addFlashMessage,
    setLoggedIn,
  } = useContext(UseContext);
  const navigate = useNavigate();
  const { application } = useParams();

  useEffect(() => {
    setRefresh(true);
    fetchTasks(application);
    checkPermits(application, 'Create');
    checkPermits(application, 'Open');
    checkPermits(application, 'To Do');
    checkPermits(application, 'Doing');
    checkPermits(application, 'Done');
  }, []);

  useEffect(() => {
    setRefresh(true);
    fetchTasks(application);
    checkPermits(application, 'Create');
    checkPermits(application, 'Open');
    checkPermits(application, 'To Do');
    checkPermits(application, 'Doing');
    checkPermits(application, 'Done');
  }, [application, showTaskModal]);

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
  async function checkPermits(application, state) {
    try {
      const permits = await fetchPermits(application);

      const stateToPermit = {
        Create: 'createPermit',
        Open: 'openPermit',
        'To Do': 'toDoPermit',
        Doing: 'doingPermit',
        Done: 'donePermit',
      };

      const permitAccess = permits[stateToPermit[state]];
      const groupResponse = await Axios.post('http://localhost:8080/checkGroup', {
        token: sessionStorage.getItem('tmsAppToken'),
        group: permitAccess,
      });

      if (groupResponse.data.success && groupResponse.data.rights) {
        if (state == 'Open') {
          setShouldRenderOpenArrows(true);
        }
        if (state == 'To Do') {
          setShouldRenderToDoArrows(true);
        }
        if (state == 'Doing') {
          setShouldRenderDoingArrows(true);
        }
        if (state == 'Done') {
          setShouldRenderDoneArrows(true);
        }
        if (state == 'Create') {
          setShouldRenderCreateTaskButton(true);
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      addFlashMessage(error.message);
    }
  }

  async function checkPermits(application, state) {
    try {
      const permits = await fetchPermits(application);

      const stateToPermit = {
        Create: 'createPermit',
        Open: 'openPermit',
        'To Do': 'toDoPermit',
        Doing: 'doingPermit',
        Done: 'donePermit',
      };

      const permitAccess = permits[stateToPermit[state]];
      const groupResponse = await Axios.post('http://localhost:8080/checkGroup', {
        token: sessionStorage.getItem('tmsAppToken'),
        group: permitAccess,
      });

      if (groupResponse.data.success && groupResponse.data.rights) {
        if (state == 'Open') {
          setShouldRenderOpenArrows(true);
        }
        if (state == 'To Do') {
          setShouldRenderToDoArrows(true);
        }
        if (state == 'Doing') {
          setShouldRenderDoingArrows(true);
        }
        if (state == 'Done') {
          setShouldRenderDoneArrows(true);
        }
        if (state == 'Create') {
          setShouldRenderCreateTaskButton(true);
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      addFlashMessage(error.message);
    }
  }

  const fetchTasks = async (application) => {
    await Axios.get(`http://localhost:8080/getTasks/${application}`)
      .then((response) => {
        setTasks(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching plans:', error);
        setError('Failed to fetch plans. Please try again later.');
        setLoading(false);
      });
  };

  // Function to open the plan modal
  const openManagePlanModal = () => {
    setShowManagePlanModal(true);
  };

  // Function to close the plan modal
  const closeManagePlanModal = () => {
    setShowManagePlanModal(false);
  };

  // Function to check user rights first when accessing "Manage Plan" button
  async function handleManagePlanClickAccess(application) {
    const userPm = await checkProjectManager();
    const userActive = await checkActive();
    handleManagePlanClick(application, userPm, userActive);
  }

  // Function to "Manage Plan"
  const handleManagePlanClick = (application, userPm, userActive) => {
    if (userPm && userActive) {
      openManagePlanModal(application);
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

  const handleTaskCreatedOrEdited = () => {
    setLoading(true);
    setError(null);
    fetchTasks(application);
  };

  const handlePlanModalClosed = () => {
    setLoading(true);
    setError(null);
    fetchTasks(application);
  };

  // Function to open the task modal
  const openTaskModal = () => {
    setShowTaskModal(true);
  };

  // Function to close the task modal
  const closeTaskModal = () => {
    setShowTaskModal(false);
  };

  // Function to check user rights first when accessing "Create Task" button
  async function handleCreateTaskClickAccess(application, changePlanPermission) {
    const userActive = await checkActive();
    const hasCreatePermit = await checkPermits(application, 'Create');
    handleCreateTaskClick(application, userActive, hasCreatePermit, changePlanPermission);
  }

  // Function to "Create Task"
  const handleCreateTaskClick = (
    application,
    userActive,
    hasCreatePermit,
    changePlanPermission
  ) => {
    if (userActive && hasCreatePermit) {
      openTaskModal(application);
      setCreateTask(true);
      setViewOnly(false);
      setViewTask(false);
      setAllowChangePlan(changePlanPermission);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!hasCreatePermit) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  async function handleViewClickAccess(task) {
    const userActive = await checkActive();
    handleViewTaskClick(task, userActive);
  }

  const handleViewTaskClick = (task, userActive) => {
    if (userActive) {
      setEditTask(task);
      openTaskModal();
      setCreateTask(false);
      setPromoteTask(false);
      setDemoteTask(false);
      setViewTask(true);
      setViewOnly(true); // Enable viewOnly state
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    }
  };

  // Function to set all the states according to the rights before opening modal
  const handleEditTaskClick = (task, userActive, hasEditPermit, changePlanPermission) => {
    if (userActive && hasEditPermit) {
      setEditTask(task);
      openTaskModal();
      setCreateTask(false);
      setViewTask(false);
      setViewOnly(false);
      setPromoteTask(false);
      setDemoteTask(false);
      setAllowChangePlan(changePlanPermission);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!hasEditPermit) {
      setEditTask(task);
      openTaskModal();
      setCreateTask(false);
      setPromoteTask(false);
      setDemoteTask(false);
      setViewTask(true);
      setViewOnly(true); // Enable viewOnly state
    }
  };

  // Function to check user rights first when accessing "Edit Task" button
  async function handleEditClickAccess(application, state, task, changePlanPermission) {
    const userActive = await checkActive();
    const hasEditPermit = await checkPermits(application, state);
    console.log('state: ', state, 'hasEditPermit: ', hasEditPermit);
    handleEditTaskClick(task, userActive, hasEditPermit, changePlanPermission);
  }

  // Function to set all the states according to the rights before opening modal
  const handlePromoteTaskClick = (
    task,
    userActive,
    hasEditPermit,
    changePlanPermission
  ) => {
    if (userActive && hasEditPermit) {
      setEditTask(task);
      openTaskModal();
      setCreateTask(false);
      setViewTask(false);
      setViewOnly(false);
      setPromoteTask(true);
      setDemoteTask(false);
      setAllowChangePlan(changePlanPermission);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!hasEditPermit) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to check user rights first when accessing "Promote" button
  async function handlePromoteClickAccess(
    application,
    state,
    task,
    changePlanPermission
  ) {
    const userActive = await checkActive();
    const hasEditPermit = await checkPermits(application, state);
    handlePromoteTaskClick(task, userActive, hasEditPermit, changePlanPermission);
  }

  // Function to set all the states according to the rights before opening modal
  const handleDemoteTaskClick = (
    task,
    userActive,
    hasEditPermit,
    changePlanPermission
  ) => {
    if (userActive && hasEditPermit) {
      setEditTask(task);
      openTaskModal();
      setCreateTask(false);
      setViewTask(false);
      setViewOnly(false);
      setPromoteTask(false);
      setDemoteTask(true);
      setAllowChangePlan(changePlanPermission);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!hasEditPermit) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to check user rights first when accessing "Demote" button
  async function handleDemoteClickAccess(application, state, task, changePlanPermission) {
    const userActive = await checkActive();
    const hasEditPermit = await checkPermits(application, state);
    handleDemoteTaskClick(task, userActive, hasEditPermit, changePlanPermission);
  }

  async function handleBackClickAccess() {
    const userActive = await checkActive();
    handleBackClick(userActive);
  }

  const handleBackClick = (userActive) => {
    if (userActive) {
      navigate('/');
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center">Error: {error}</div>;
  }

  const filterTasksByState = (state) => {
    return tasks.filter(
      (task) => task.Task_state === state && task.Task_app_Acronym === application
    );
  };

  return (
    <>
      <div
        className="d-flex justify-content-between align-items-center"
        style={{ minHeight: '80px' }}
      >
        <div className="col-4">
          <button
            className="btn pageBtns "
            style={{ marginLeft: '0.5em' }}
            onClick={handleBackClickAccess}
          >
            Back
          </button>
        </div>
        <div className="col-4">
          <h3 className="text-center flex-grow-1">{application}</h3>
        </div>
        <div className="col-4">
          <div
            className="kanban-buttons"
            style={{ marginRight: '1.4em', float: 'right' }}
          >
            {isProjectManager && (
              <button
                className="btn pageBtns"
                style={{ marginLeft: '20px' }}
                onClick={() => handleManagePlanClickAccess(application)}
              >
                Manage Plan
              </button>
            )}
            {shouldRenderCreateTaskButton && (
              <button
                className="btn pageBtns"
                style={{ marginLeft: '20px' }}
                onClick={() => handleCreateTaskClickAccess(application, true)}
              >
                Create Task
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="kanban-board">
        <div className="kanban-column">
          <h5 className="kanban-header">Open</h5>
          {filterTasksByState('Open').map((task) => (
            <div
              key={task.Task_id}
              className="card mb-3 kanban-card"
              style={{ borderColor: task.Task_Plan_color, borderWidth: '3px' }}
            >
              <div className="card-body">
                <div className="row card-descriptions">
                  <div className="col-9">
                    <p className="card-title">{task.Task_name}</p>
                    <p className="card-text">
                      {task.Task_plan
                        ? `Plan: ${task.Task_plan}`
                        : 'Not assigned to any plan'}
                    </p>
                  </div>
                  <div className="col-2 info-and-arrow-spacing">
                    <button
                      className="pageBtns kanbanEditBtns"
                      onClick={() =>
                        handleEditClickAccess(application, 'Open', task, true)
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-info-square-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.93 4.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="card-bottom">
                  <div className="col-2 info-and-arrow-spacing"></div>
                  {task.Task_Plan_startDate && (
                    <div className="card-date col-4>">
                      Start Date: {task.Task_Plan_startDate}
                    </div>
                  )}
                  {task.Task_Plan_endDate && (
                    <div className="card-date col-4>">
                      End Date: {task.Task_Plan_endDate}
                    </div>
                  )}
                  {!task.Task_Plan_startDate && !task.Task_Plan_endDate && (
                    <div className="col-8"></div>
                  )}
                  {shouldRenderOpenArrows ? (
                    <div className="col-2 info-and-arrow-spacing">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-caret-right-fill arrow-icons"
                        viewBox="0 0 16 16"
                        onClick={() =>
                          handlePromoteClickAccess(application, 'Open', task, true)
                        }
                      >
                        <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="col-2 info-and-arrow-spacing"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="kanban-column">
          <h5 className="kanban-header">To Do</h5>
          {filterTasksByState('To Do').map((task) => (
            <div
              key={task.Task_id}
              className="card mb-3 kanban-card"
              style={{ borderColor: task.Task_Plan_color, borderWidth: '3px' }}
            >
              <div className="card-body">
                <div className="row card-descriptions">
                  <div className="col-9">
                    <p className="card-title">{task.Task_name}</p>
                    <p className="card-text">
                      {task.Task_plan
                        ? `Plan: ${task.Task_plan}`
                        : 'Not assigned to any plan'}
                    </p>
                  </div>
                  <div className="col-2 info-and-arrow-spacing">
                    <button
                      className="pageBtns kanbanEditBtns"
                      onClick={() =>
                        handleEditClickAccess(application, 'To Do', task, false)
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-info-square-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.93 4.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="card-bottom">
                  <div className="col-2 info-and-arrow-spacing"></div>
                  {task.Task_Plan_startDate && (
                    <div className="card-date col-4>">
                      Start Date: {task.Task_Plan_startDate}
                    </div>
                  )}
                  {task.Task_Plan_endDate && (
                    <div className="card-date col-4>">
                      End Date: {task.Task_Plan_endDate}
                    </div>
                  )}
                  {!task.Task_Plan_startDate && !task.Task_Plan_endDate && (
                    <div className="col-8"></div>
                  )}
                  {shouldRenderToDoArrows ? (
                    <div className="col-2 info-and-arrow-spacing">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-caret-right-fill arrow-icons"
                        viewBox="0 0 16 16"
                        onClick={() =>
                          handlePromoteClickAccess(application, 'To Do', task, false)
                        }
                      >
                        <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="col-2 info-and-arrow-spacing"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="kanban-column">
          <h5 className="kanban-header">Doing</h5>
          {filterTasksByState('Doing').map((task) => (
            <div
              key={task.Task_id}
              className="card mb-3 kanban-card"
              style={{ borderColor: task.Task_Plan_color, borderWidth: '3px' }}
            >
              <div className="card-body">
                <div className="row card-descriptions">
                  <div className="col-9">
                    <p className="card-title">{task.Task_name}</p>
                    <p className="card-text">
                      {task.Task_plan
                        ? `Plan: ${task.Task_plan}`
                        : 'Not assigned to any plan'}
                    </p>
                  </div>
                  <div className="col-2 info-and-arrow-spacing">
                    <button
                      className="pageBtns kanbanEditBtns"
                      onClick={() =>
                        handleEditClickAccess(application, 'Doing', task, false)
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-info-square-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.93 4.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="card-bottom">
                  {shouldRenderDoingArrows ? (
                    <div className="col-2 info-and-arrow-spacing">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        onClick={() =>
                          handleDemoteClickAccess(application, 'Doing', task, false)
                        }
                        className="bi bi-caret-left-fill arrow-icons"
                        viewBox="0 0 16 16"
                      >
                        <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="col-2 info-and-arrow-spacing"></div>
                  )}
                  {task.Task_Plan_startDate && (
                    <div className="card-date col-4>">
                      Start Date: {task.Task_Plan_startDate}
                    </div>
                  )}
                  {task.Task_Plan_endDate && (
                    <div className="card-date col-4>">
                      End Date: {task.Task_Plan_endDate}
                    </div>
                  )}
                  {!task.Task_Plan_startDate && !task.Task_Plan_endDate && (
                    <div className="col-8"></div>
                  )}
                  {shouldRenderDoingArrows ? (
                    <div className="col-2 info-and-arrow-spacing">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        onClick={() =>
                          handlePromoteClickAccess(application, 'Doing', task, false)
                        }
                        className="bi bi-caret-right-fill arrow-icons"
                        viewBox="0 0 16 16"
                      >
                        <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="col-2 info-and-arrow-spacing"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="kanban-column">
          <h5 className="kanban-header">Done</h5>
          {filterTasksByState('Done').map((task) => (
            <div
              key={task.Task_id}
              className="card mb-3 kanban-card"
              style={{ borderColor: task.Task_Plan_color, borderWidth: '3px' }}
            >
              <div className="card-body">
                <div className="row card-descriptions">
                  <div className="col-9">
                    <p className="card-title">{task.Task_name}</p>
                    <p className="card-text">
                      {task.Task_plan
                        ? `Plan: ${task.Task_plan}`
                        : 'Not assigned to any plan'}
                    </p>
                  </div>
                  <div className="col-2 info-and-arrow-spacing">
                    <button
                      className="pageBtns kanbanEditBtns"
                      onClick={() =>
                        handleEditClickAccess(application, 'Done', task, false)
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-info-square-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.93 4.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="card-bottom">
                  {shouldRenderDoneArrows ? (
                    <div className="col-2 info-and-arrow-spacing">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        onClick={() =>
                          handleDemoteClickAccess(application, 'Done', task, true)
                        }
                        className="bi bi-caret-left-fill arrow-icons"
                        viewBox="0 0 16 16"
                      >
                        <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="col-2 info-and-arrow-spacing"></div>
                  )}
                  {task.Task_Plan_startDate && (
                    <div className="card-date col-4>">
                      Start Date: {task.Task_Plan_startDate}
                    </div>
                  )}
                  {task.Task_Plan_endDate && (
                    <div className="card-date col-4>">
                      End Date: {task.Task_Plan_endDate}
                    </div>
                  )}
                  {!task.Task_Plan_startDate && !task.Task_Plan_endDate && (
                    <div className="col-8"></div>
                  )}
                  {shouldRenderDoneArrows ? (
                    <div className="col-2 info-and-arrow-spacing">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        onClick={() =>
                          handlePromoteClickAccess(application, 'Done', task, false)
                        }
                        className="bi bi-caret-right-fill arrow-icons"
                        viewBox="0 0 16 16"
                      >
                        <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="col-2 info-and-arrow-spacing"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="kanban-column">
          <h5 className="kanban-header">Closed</h5>
          {filterTasksByState('Closed').map((task) => (
            <div
              key={task.Task_id}
              className="card mb-3 kanban-card"
              style={{ borderColor: task.Task_Plan_color, borderWidth: '3px' }}
            >
              <div className="card-body">
                <div className="row card-descriptions">
                  <div className="col-9">
                    <p className="card-title">{task.Task_name}</p>
                    <p className="card-text">
                      {task.Task_plan
                        ? `Plan: ${task.Task_plan}`
                        : 'Not assigned to any plan'}
                    </p>
                  </div>
                  <div className="col-2 info-and-arrow-spacing">
                    <button
                      className="pageBtns kanbanEditBtns"
                      onClick={() => handleViewClickAccess(task)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-info-square-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.93 4.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM8 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="card-bottom">
                  <div className="col-2 info-and-arrow-spacing"></div>
                  {task.Task_Plan_startDate && (
                    <div className="card-date col-4>">
                      Start Date: {task.Task_Plan_startDate}
                    </div>
                  )}
                  {task.Task_Plan_endDate && (
                    <div className="card-date col-4>">
                      End Date: {task.Task_Plan_endDate}
                    </div>
                  )}
                  {!task.Task_Plan_startDate && !task.Task_Plan_endDate && (
                    <div className="col-8"></div>
                  )}
                  <div className="col-2 info-and-arrow-spacing"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ManagePlan
        showManagePlanModal={showManagePlanModal}
        closeManagePlanModal={closeManagePlanModal}
        onPlanModalClosed={handlePlanModalClosed}
        application={application}
      />
      <TaskModal
        showTaskModal={showTaskModal}
        closeTaskModal={closeTaskModal}
        createTask={createTask}
        viewTask={viewTask}
        viewOnly={viewOnly}
        editTask={editTask}
        promoteTask={promoteTask}
        demoteTask={demoteTask}
        allowChangePlan={allowChangePlan}
        onTaskCreatedorEdited={handleTaskCreatedOrEdited}
        application={application}
      />
    </>
  );
}
export default KanbanBoard;
