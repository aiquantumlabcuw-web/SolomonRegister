import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import TextFields from "../components/TextFields";
import Button from "../components/Button";
import { updateNames } from "../buttonActions/updateNames";
import GlobalConfig from "../../../config/GlobalConfig";

export default function AccountDetails() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [edit, setEdit] = useState(false);
  const fileInputRef = useRef();
  const [image, setImage] = useState(null);
  const [updateFname, setUpdateFname] = useState("");
  const [updateLname, setUpdateLname] = useState("");

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`${GlobalConfig.nodeUrl}/api/userDetails`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });

        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to fetch user details');
      }
    };

    fetchUserDetails();
  }, []);

  if (error) {
    return <div className="h-screen bg-zinc-100 flex justify-center items-center">{error}</div>;
  }

  if (!user) {
    return <div className="h-screen bg-zinc-100 flex justify-center items-center">Loading...</div>;
  }

  const formattedImageUrl = user.imageurl ? user.imageurl.replace(/\\/g, '/') : '';
  let fullImageUrl;
  if (formattedImageUrl !== "") {
    fullImageUrl = `${GlobalConfig.nodeUrl}/${formattedImageUrl}`;
  } else {
    fullImageUrl = `http://localhost:5173/profile-icon.webp`;
  }

  return (
    <div className="min-h-screen w-full bg-zinc-100 flex flex-col justify-center items-center">
      <h2 className="text-gray-500 font-bold text-4xl mb-8">Edit User Profile</h2>
      
      <div className="flex bg-white w-4/5 md:w-3/5 lg:w-3/5 h-4/6 shadow-lg rounded-xl p-8">
        {/* Left Section - Profile Image */}
        <div className="w-1/3 flex flex-col items-center justify-center">
          <div className="h-40 w-40">
            <img
              className="h-full w-full object-cover rounded-lg shadow-md border border-gray-300"
              src={fullImageUrl}
              alt="Profile"
            />
          </div>
          <div className="mt-4">
            {edit ? (
              <button
                onClick={() => fileInputRef.current.click()}
                className="mt-4 px-6 py-2 border border-blue-500 text-blue-500 rounded-md"
              >
                Upload Image
              </button>
            ) : null}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>
        </div>

        {/* Right Section - User Details */}
        <div className="w-2/3 flex flex-col justify-between pl-8">
          <div className="text-lg">
            <div className="mb-4">
              <span className="text-blue-600 font-bold">Email:</span>
              <div className="text-gray-700">{user.email}</div>
            </div>
            <div className="mb-4">
              <span className="text-blue-600 font-bold">First Name:</span>
              {!edit ? (
                <div className="text-gray-700">{user.first_name}</div>
              ) : (
                <TextFields
                  placeholder="First Name"
                  defaultValue={user.first_name}
                  onChange={(e) => setUpdateFname(e.target.value)}
                />
              )}
            </div>
            <div className="mb-4">
              <span className="text-blue-600 font-bold">Last Name:</span>
              {!edit ? (
                <div className="text-gray-700">{user.last_name}</div>
              ) : (
                <TextFields
                  placeholder="Last Name"
                  defaultValue={user.last_name}
                  onChange={(e) => setUpdateLname(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            {edit ? (
              <>
                <button
                  onClick={() => updateNames(updateFname, updateLname, image)}
                  className="px-8 py-2 bg-blue-500 text-white rounded-md shadow-md"
                >
                  Update
                </button>
                <button
                  onClick={() => setEdit(false)}
                  className="px-8 py-2 bg-gray-200 text-gray-700 border border-gray-300 rounded-md shadow-md"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEdit(true)}
                className="px-8 py-2 border border-blue-500 text-blue-500 rounded-md"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
