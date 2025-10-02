import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GlobalConfig from '../../../config/GlobalConfig';
const ViewRoles = () => {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${GlobalConfig.nodeUrl}/role/roles`);
        setRoles(response.data.roles);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchRoles();
  }, []);

  const handleDelete = async (roleId) => {
    try {
      await axios.delete(`${GlobalConfig.nodeUrl}/role/${roleId}`);
      setRoles(roles.filter(role => role._id !== roleId));
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  return (
    <div className='m-4 border border-gray-300 rounded-3xl shadow-2xl w-3/4'>
      <div className='p-4'>
        <h2 className="text-2xl mb-4">View Roles</h2>
        <table className="min-w-full leading-normal border">
          <thead className='bg-gray-200 text-blue-900 '>
            <tr>
              <th className="px-5 py-3 border-b-2 text-left   font-bold   uppercase tracking-wider">
                Role Name
              </th>
              <th className="px-5 py-3 border-b-2   text-left  font-bold   uppercase tracking-wider">
                Privileges
              </th>
              <th className="px-5 py-3 border-b-2   text-left  font-bold    uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role._id}>
                <td className="px-5 py-3 border-b-2 border-gray-300 bg-white text-sm">
                  {role.role_name}
                </td>
                <td className="px-5 py-3 border-b-2 border-gray-300 bg-white text-sm">
                  {role.privileges.map(privilege => privilege?.privilege_name).join(', ')
                  }
                </td>
                <td className="px-5 py-3 border-b-2 border-gray-300 bg-white text-sm">
                  <div
                    onClick={() => handleDelete(role._id)}
                    className=" text-red-500 font-semibold rounded"
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

export default ViewRoles;
