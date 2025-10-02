import { useEffect, useState } from "react";
import GlobalConfig from "../../../config/GlobalConfig";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import sendLinkToUser from "../adminActions/sendLink";

export default function AllUsers() {
    const navigate = useNavigate();
    const [resetLink, setResetLink] = useState("Send the reset link");

    const [Users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 7; // Number of users to display per page

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${GlobalConfig.nodeUrl}/admin/getAllUsers`, {
                    headers: {
                        "authorization": sessionStorage.getItem("token")
                    }
                });
                setUsers(response.data.Users);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);
    // Calculate the current users to display
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = Users?.slice(indexOfFirstUser, indexOfLastUser);

    // Calculate the total number of pages
    const totalPages = Math.ceil(Users?.length / usersPerPage);

    // Pagination handler
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <>
            <div className="m-4 p-4 border border-gray-300 rounded-3xl shadow-2xl w-3/4">
                <table className="table border-collapse border-2 border-gray-300 text-left w-full">
                        <thead className='bg-gray-200 text-blue-900 text-sm'>
                        <tr>
                            <th className="px-6 py-4 w-80 font-semibold border-b-2 border-gray-300">Email</th>
                            <th className="px-6 py-4 w-28 font-semibold border-b-2 border-gray-300">Role</th>
                            {/* <th className="px-6 py-4 w-28 font-semibold border-b-2 border-gray-300">First Name</th> */}
                            {/* <th className="px-4 py-4 w-28 font-semibold border-b-2 border-gray-300">Last Name</th> */}
                            <th className="px-4 py-4 w-48 font-semibold border-b-2 border-gray-300">Edit Details</th>
                            <th className="px-4 py-4 w-56 font-semibold border-b-2 border-gray-300">Password Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers?.map((user, index) => (
                            <tr key={index} className="text-xs">
                                <td className="px-6 py-4  border-b border-gray-300 truncate max-w-[120px] "> {user.email}</td>
                                <td className="px-6 py-4 w-28 border-b border-gray-300 "> {user.role_id?.role_name || "Unknown Role"}</td>
                                {/* <td className="px-6 py-4 w-28 text-sm max-w-[6rem] border-b border-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {user.first_name}
                                </td> */}
                                {/* <td className="px-6 py-4 text-sm border-b border-gray-300 overflow-hidden text-ellipsis whitespace-nowrap "> {user.last_name}</td> */}
                                <td onClick={() => {
                                    console.log(user._id)
                                    navigate(`/edit-user/${user._id}`);
                                }} className="px-4 py-4 border-b border-gray-300 cursor-pointer hover:text-gray-600 hover:underline"> edit user details</td>
                                <td onClick={() => {
                                    sendLinkToUser(user._id, user.email, setResetLink);
                                }} className="px-4 py-4 border-b border-gray-300 cursor-pointer hover:underline hover:text-green-600 ">  {resetLink}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex justify-center mt-4">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={`mx-2 px-2  rounded ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}