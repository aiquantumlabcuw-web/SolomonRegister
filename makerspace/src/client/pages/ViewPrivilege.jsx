import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GlobalConfig from '../../../config/GlobalConfig';
const ViewPrivilege = () => {
  const [privileges, setPrivileges] = useState([]);

  useEffect(() => {
    fetchPrivileges();
  }, []);

  const fetchPrivileges = async () => {
    try {
      const response = await axios.get(`${GlobalConfig.nodeUrl}/privilege/privileges`);
      setPrivileges(response.data.privileges);
    } catch (error) {
      console.error('An error occurred while fetching privileges:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${GlobalConfig.nodeUrl}/privilege/${id}`);
      fetchPrivileges(); // Refresh the list after deletion
    } catch (error) {
      console.error('An error occurred while deleting the privilege:', error);
    }
  };

  return (
    <div className='m-4 border border-gray-300 rounded-3xl shadow-2xl w-3/4'>
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Privileges</h2>
        <table className="w-full bg-white border">
          <thead className='bg-gray-200 text-blue-900'>
            <tr>
              <th className="px-6 py-4 w-96 font-bold border-b-2 border-gray-300 text-left">Privilege Name</th>
              <th className="px-6 py-4 w-96 font-bold border-b-2 border-gray-300 text-left">Description</th>
              <th className="px-6 py-4 font-bold border-b-2 border-gray-300 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {privileges.map((privilege) => (
              <tr key={privilege._id}>
                <td className="px-6 py-4 border-b">{privilege.privilege_name}</td>
                <td className="px-6 py-4 border-b">{privilege.description}</td>
                <td className="px-6 py-4 border-b">
                  <div
                    onClick={() => handleDelete(privilege._id)}
                    className="text-red-500 font-semibold   rounded"
                  >
                    Delete
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
};

export default ViewPrivilege;
