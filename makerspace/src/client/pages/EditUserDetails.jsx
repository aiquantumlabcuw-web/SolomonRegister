import { useEffect, useRef, useState } from "react";
 
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import deleteTheUser from "../adminActions/deleteUser";
import GlobalConfig from "../../../config/GlobalConfig";

export default function EditUserDetails() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);


    useEffect(() => {

        const fetchUser = async () => {
            try {
                const response = await axios.get(`${GlobalConfig.nodeUrl}/admin/getUser/${id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": sessionStorage.getItem("token")
                    }
                });
                setUser(response.data.user);

            } catch (error) {
                navigate("/home");
                console.error('Error fetching user:', error);
            }
        };

        fetchUser();
    }, [id]);

    if (!user) {
        return <div className="h-screen w-screen bg-zinc-100 flex justify-center items-center">Loading...</div>;
    }



    const formattedImageUrl = user.imageurl ? user.imageurl.replace(/\\/g, '/') : '';
    let fullImageUrl
    if(formattedImageUrl != ""){
        fullImageUrl = `http://localhost:3000/${formattedImageUrl}`;
    }else{
        fullImageUrl = `/profile-icon.webp`;    
    }
    
    return <>
            <div className="h-screen w-screen bg-zinc-200 ">
        <div className="flex justify-center text-blue-600 py-10 font-medium text-3xl  ">Edit User Profile  </div>

            <div className="flex justify-center items-center ">
                <div className=" bg-zinc-100 w-[80%]  border rounded-xl"  >

                <div className="flex">

                <div className="w-96 p-6" >
                    <img className=" object-cover" style={{ borderRadius: "5%", border: "0.02rem solid black" }} src={fullImageUrl} alt="No image found" />
                </div>
                    <div className="">

                    <div className="w-96 m-4 text-blue-600 text-xl ">Email : <div className="font-medium font-sans	font-family: ui-sans-serif  text-lg text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap"> {user.email}</div>
                    </div>
                    <div className="m-4 text-blue-600 text-xl">Role : <div className="font-medium  text-lg text-slate-600"> {user.role_id?.role_name || "unknown role"} </div></div>
                    <div className="m-4 text-blue-600 text-xl">First Name : <div className="font-medium text-lg text-slate-600"> {user.first_name} </div></div>
                    <div className="m-4 text-blue-600 text-xl">Last Name : <div className="font-medium text-lg text-slate-600"> {user.last_name} </div></div>

                    <div className="flex ">

                        <div onClick={() => {
                            navigate(`/editUserProfile/${id}`)
                        }}>
                            <button type="button" className=" border border-blue-600 border-dashed text-blue-500 text-base px-2 py-1 bg-white rounded text-center">
                                Edit profile
                            </button>
                        </div>
                            {/* <button onClick={() => {
                                deleteTheUser(user.email, id)
                            }} type="button" className=" text-white text-xs bg-red-500 hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full  text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800">Delete User</button> */}
                        
                        <div  className="ml-2  w-28 h-12">
                            <button onClick={() => {
                                deleteTheUser(user.email, id)
                            }} className="bg-red-500 text-white text-base rounded px-2 py-1 ">
                                Delete User
                            </button>
                        </div>

                    </div>


                </div>
                </div>
            </div>
            </div>
        </div>

    </>



}