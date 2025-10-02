
import { useNavigate, useParams } from 'react-router-dom';
import TextFields from './TextFields'
import { useEffect, useRef, useState } from 'react';
import userUpdate from '../adminActions/userUpdate';
import axios from 'axios';
import GlobalConfig from '../../../config/GlobalConfig';
export default function EditUserProfile() {

    const { id } = useParams();
    const navigate = useNavigate(); 
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const fileInputRef = useRef();
    const [image, setImage] = useState(null);
    const [user, setUser] = useState(null);
    const [role,setRole]=useState("");
    const [roleList, setRoleList] = useState([])
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

 

    // const formattedImageUrl = user.imageurl ? user.imageurl.replace(/\\/g, '/') : '';
    // let fullImageUrl = ""
    // if (formattedImageUrl != "") {
    //     fullImageUrl = `http://localhost:3000/${formattedImageUrl}`;
    // } else {
    //     fullImageUrl = `http://localhost:5173/profile-icon.webp`;
    // }
    
        
    
    useEffect(()=>{
        const fetchData = async () => {
        const response = await fetch(`${GlobalConfig.nodeUrl}/role/roles`,{
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setRoleList(data.roles);
    }

    fetchData();
},[])
console.log(role);
if (!user) {
    return <div className="h-screen w-screen  bg-zinc-100 flex justify-center items-center">Loading...</div>;
}
        return<>
            <div className="h-screen w-screen bg-zinc-200 ">
            <div className="flex justify-center text-blue-600 py-10 font-medium text-3xl  ">Edit User Profile  </div>

            <div className="flex justify-center items-center ">
                <div className=" bg-zinc-100 w-[80%] border rounded-xl">
                    <div className='flex'>
                        <div>
                            <div className=" h-60 w-64 mx-12 my-12" >
                                <img className="h-full w-80 object-cover" style={{ borderRadius: "5%", border: "0.02rem solid black" }} src="/profile-icon.webp" alt="No image found" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    setImage(e.target.files[0]);
                                }}
                            />
                            <div className='mx-24 mt-2 mb-8'>
                                <button type="button" onClick={() => {
                                    fileInputRef.current.click();
                                }} className="   border border-blue-600 border text-blue-500 text-sm px-8 py-2 bg-white rounded text-center">
                                    Upload image
                                </button>
                            </div>
                        </div>

                        <div className='mt-8'>

                            <div className="text-blue-600 text-lg">Email  :
                            </div>
                            <div className="w-full" >
                                <input onChange={(e) => {
                                setEmail(e.target.value);
                            }}  id="" className="m-1 pl-2 bg-gray-300 border border-white focus:outline-none  text-gray-900 text-base rounded-lg block w-full " placeholder="Email here" required />
                            </div>

                            <div className="mt-1 text-blue-600 text-lg">Role  :
                            </div>
                            <div className='ml-2'>
                                <select onChange={(e) => {
                                    setRole(e.target.value)
                                }}  className= 'px-8 text-gray-700 bg-gray-300 border border-gray rounded outline-none'  value={role}>
                                    {roleList.map((role)=>(
                                        <option>{role.role_name}</option>
                                    ))}
                                    {/* <option>User</option>
                                    <option>Admin</option> */}
                                </select>
                            </div>


                            <div className="mt-1 text-blue-600 text-lg">First Name : <div className="font-medium font-sans	font-family: ui-sans-serif  text-2xl text-slate-600"></div>
                            </div>
                            <div className="w-full" >
                                <input onChange={(e) => {
                                    setFirstName(e.target.value);
                                }} id="first_name" className="m-1 pl-2 bg-gray-300 border border-white focus:outline-none  text-gray-900 text-base rounded-lg block w-full " placeholder="First Name here" required />
                            </div>


                            <div className="text-blue-600 text-lg">LastName : <div className="font-medium font-sans	font-family: ui-sans-serif  text-2xl text-slate-600"></div>
                            </div>
                            <div className='w-full'>
                                <input onChange={(e) => {
                                    setLastName(e.target.value);
                                }} id="first_name" className="m-1 pl-2 bg-gray-300 border border-white focus:outline-none  text-gray-900 text-base rounded-lg block w-full" placeholder="Last Name here" required />
                            </div>
                            <div className="flex my-10 ">

                            <button onClick={()=>userUpdate(email,firstName,lastName,id,role,image)}  type="button" className="text-white h-8  text-base px-4  bg-blue-600 font-medium rounded text-center">
                                UPDATE
                            </button>

                                <button onClick={() => {
                                    navigate(`/edit-user/${id}`);
                                    }} type="button" className=" ml-4 h-8 text-blue-600 border border-blue-700 text-base px-4  bg-white font-medium rounded text-center">
                                    CANCEL
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </div>
    </>
    
}