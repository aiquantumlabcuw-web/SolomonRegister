import React, { useState } from 'react';
import axios from 'axios';

const AddPrivilege = () => {
  const [privilegeName, setPrivilegeName] = useState('');
  const [privilegeDescription, setPrivilegeDescription] = useState('');
  const [message, setMessage] = useState('');
  const [allowedToChangeTicketStatus, setAllowedToChangeTicketStatus] = useState(false);
  const [allowedToUpdateTicketDetails, setAllowedToUpdateTicketDetails] = useState(false);
  const [allowedToViewAllTickets, setAllowedToViewAllTickets] = useState(false);
  const [allowedToSendCommentsToUser, setAllowedToSendCommentsToUser] = useState(false);
  const [allowedToEditUsers, setAllowedToEditUsers] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/privilege/privileges', {
        privilege_name: privilegeName,
        description: privilegeDescription,
        isAllowedToChangeTicketStatus: allowedToChangeTicketStatus,
        isAllowedToUpdateTicketDetails: allowedToUpdateTicketDetails,
        isAllowedToViewAllTickets: allowedToViewAllTickets,
        isAllowedToSendAndReceiveComments: allowedToSendCommentsToUser,
        isAllowedToAddDeleteUsers: allowedToEditUsers,
        
      });
      setMessage(response.data.msg);
      setPrivilegeName('');
      setPrivilegeDescription('');
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while creating the privilege');
    }
  };

  return (
    <div className="flex flex-col flex-grow p-8">
      <h2 className="text-2xl mb-4">Add Privilege</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="privilegeName">
            Privilege Name
          </label>
          <input
            type="text"
            id="privilegeName"
            value={privilegeName}
            onChange={(e) => setPrivilegeName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Allowed Privileges
          </label>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={allowedToChangeTicketStatus}
              onChange={(e) => setAllowedToChangeTicketStatus(e.target.checked)}
              className="mr-2"
            />
            <label className="text-gray-700">Allowed to Change Ticket Status</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={allowedToUpdateTicketDetails}
              onChange={(e) => setAllowedToUpdateTicketDetails(e.target.checked)}
              className="mr-2"
            />
            <label className="text-gray-700">Allowed to Update Ticket Details</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={allowedToViewAllTickets}
              onChange={(e) => setAllowedToViewAllTickets(e.target.checked)}
              className="mr-2"
            />
            <label className="text-gray-700">Allowed to View All Tickets</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={allowedToSendCommentsToUser}
              onChange={(e) => setAllowedToSendCommentsToUser(e.target.checked)}
              className="mr-2"
            />
            <label className="text-gray-700">Allowed to Send Comments to User</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={allowedToEditUsers}
              onChange={(e) => setAllowedToEditUsers(e.target.checked)}
              className="mr-2"
            />
            <label className="text-gray-700">Allowed to Edit Users</label>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="privilegeDescription">
            Privilege Description
          </label>
          <textarea
            id="privilegeDescription"
            value={privilegeDescription}
            onChange={(e) => setPrivilegeDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="4"
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add Privilege
        </button>
      </form>
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
};

export default AddPrivilege;
