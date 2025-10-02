import { useState } from "react"
import Button from "../components/Button"
import PasswordToggle from "../components/PasswordField"
import userPassChange from "../adminActions/userPassChange";
import { useParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { warning } from "../store/atoms/isLoggedIn";
export default function UserPasswordChange(){
    const[newPassword,setNewPassword]=useState("");
    const[repNewPassword,setRepNewPassword]=useState("");
    const { id }= useParams();
    const setWarning = useSetRecoilState(warning)
    return <>
             <div className="mb-auto">
            <div className="m-auto  w-1/2 h-auto border mt-20  ">
            <div className="m-8 font-medium">
                <div className="" ><li>Minimum Length: The password should be at least 8 characters long .</li></div>
                <div><li>Uppercase Letter: The password should contain at least one uppercase letter.</li></div>   
                 <div><li>Lowercase Letter: The password should contain at least one lowercase letter.</li></div>   
                 <div><li>Digit: The password should contain at least one numeric digit.</li></div>   
                 <div><li>Special Character: The password should contain at least one special character (e.g., !@#$%^&*).</li></div>   
                 <div><li>No Spaces: The password should not contain spaces.</li></div>   
                  <div><li>Avoid Similarity to Old Password: The new password should not be too similar to the old password.</li></div>      
 

            </div>
            
            <div className="mt-8 m-2 pl-4  text-gray-500 font-medium text-2xl">
                Password Change
            </div>
             
            <div >
                <div className="ml-8 m-4 font-normal text-2xl">
                    New Password:
                </div>
                <div className="w-4/12 ml-8">
                    <PasswordToggle onChange={(e)=>{
                        setNewPassword(e.target.value)
                    }}/>
                </div>
            </div>
            <div >
                <div className="ml-8 m-4 font-normal text-2xl">
                    Confirm New Password:
                </div>
                <div className="w-4/12 ml-8">
                    <PasswordToggle onChange={(e)=>{
                        setRepNewPassword(e.target.value)
                    }} />
                </div>
                 
            </div>
                <div className="mt-1 ml-10 normal text-red-500"></div>
            <div className="m-4 w-24">
                <Button label={"Submit"}  onClick={()=>{
                    userPassChange(newPassword,repNewPassword,id,setWarning)
                }} />
            </div>
          
        </div>
        </div>

    </>
}