import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from './Page';
import Axios from 'axios';
import UseContext from '../UseContext';
import UserModal from './UserModal';
import GroupModal from './GroupModal';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [createUser, setCreateUser] = useState('');
  const [editUser, setEditUser] = useState(null);
  const { setRefresh, checkAdmin, checkActive, addFlashMessage, setLoggedIn } =
    useContext(UseContext);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    await Axios.get('http://localhost:8080/getUsers')
      .then((response) => {
        setUsers(response.data); // Store user data in users
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
        setError('Failed to fetch users. Please try again later.');
        setLoading(false);
      });
  };

  const fetchGroups = async () => {
    await Axios.get('http://localhost:8080/getUserGroups')
      .then((response) => {
        setGroups(response.data); // Store user data in users
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching groups:', error);
        setError('Failed to fetch groups. Please try again later.');
        setLoading(false);
      });
  };

  useEffect(() => {
    setRefresh(true); // When accessing page, change state to refresh, so can re-run admin group
    fetchUsers();
    fetchGroups();
  }, []);

  // Function to re-render the user table shown in main user management page
  const handleUserCreatedOrEdited = () => {
    setLoading(true);
    setError(null);
    fetchUsers();
  };

  // Function to open the user modal
  const openUserModal = () => {
    setShowUserModal(true);
  };

  // Function to close the user modal
  const closeUserModal = () => {
    setShowUserModal(false);
  };

  // Function to pass the user details to the edit modal
  const handleEditClick = (user, userAdmin, userActive) => {
    if (userAdmin && userActive) {
      setEditUser(user);
      openUserModal();
      setCreateUser(false);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!userAdmin) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to check admin rights first when onclick "Edit"
  async function handleEditClickAccess(user) {
    const userAdmin = await checkAdmin();
    const userActive = await checkActive();
    handleEditClick(user, userAdmin, userActive);
  }

  // Function to handle clicking the "Create New User" button

  const handleCreateUserClick = (userAdmin, userActive) => {
    if (userAdmin && userActive) {
      openUserModal();
      setCreateUser(true);
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!userAdmin) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  // Function to check admin rights first when onclick "Create New User"
  async function handleCreateUserClickAccess() {
    const userAdmin = await checkAdmin();
    const userActive = await checkActive();
    handleCreateUserClick(userAdmin, userActive);
  }
  /*************************************************************/

  /*************************** Group ***************************/
  // Function to open the "Create New Group" modal
  const openGroupModal = () => {
    setShowGroupModal(true);
  };

  // Function to close the "Create New Group" modal
  const closeGroupModal = () => {
    setShowGroupModal(false);
  };

  // Function to handle clicking the "Create New Group" button
  const handleCreateGroupClick = (userAdmin, userActive) => {
    if (userAdmin && userActive) {
      closeUserModal(); // Close UserModal
      openGroupModal(); // Open GroupModal
    } else if (!userActive) {
      addFlashMessage('Your account has been disabled.');
      setLoggedIn(false);
      sessionStorage.removeItem('tmsAppToken');
    } else if (!userAdmin) {
      addFlashMessage('No Access');
      setRefresh(true);
      navigate('/');
    }
  };

  async function handleCreateGroupClickAccess() {
    const userAdmin = await checkAdmin();
    const userActive = await checkActive();
    handleCreateGroupClick(userAdmin, userActive);
  }

  const handleGroupCreated = () => {
    setLoading(true);
    setError(null);
    fetchUsers();
    fetchGroups();
  };
  /*************************************************************/

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center">Error: {error}</div>;
  }

  return (
    <Page title="User Management">
      <div className="page-container">
        <div className="container">
          <h1 className="text-center userManagement-header">USER MANAGEMENT</h1>

          <div className="row" style={{ marginTop: '30px' }}>
            <div className="table-container col-8">
              <table className="table table-bordered user-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Group</th>
                    <th>is Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {/*array that stored the user data fetched from server*/}
                  {users.map((user) => (
                    <tr key={user.username}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.group
                          ? user.group
                              .split(',')
                              .map((group) => group.trim().replace(/^\.+|\.+$/g, ''))
                              .filter((group) => group !== '')
                              .join(', ')
                          : ''}
                      </td>
                      <td>{user.isActive == 1 ? 'Active' : 'Not Active'}</td>
                      <td>
                        <button
                          className="btn pageBtns"
                          onClick={() => handleEditClickAccess(user)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-container col-2">
              <table className="table table-bordered group-table">
                <thead>
                  <tr>
                    <th>User Groups</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.group_name}>
                      <td>{group.group_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="text-center"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: '10px 80px',
            }}
          >
            <button className="pageBtns btn" onClick={handleCreateUserClickAccess}>
              Create New User
            </button>
            <button className="pageBtns btn ml-2" onClick={handleCreateGroupClickAccess}>
              Create New Group
            </button>
          </div>
          <UserModal
            showUserModal={showUserModal}
            closeUserModal={closeUserModal}
            createUser={createUser}
            editUser={editUser}
            onUserCreatedorEdited={handleUserCreatedOrEdited}
          />
          <GroupModal
            showGroupModal={showGroupModal}
            closeGroupModal={closeGroupModal}
            onGroupCreated={handleGroupCreated}
          />
        </div>
      </div>
    </Page>
  );
}

export default UserManagement;
