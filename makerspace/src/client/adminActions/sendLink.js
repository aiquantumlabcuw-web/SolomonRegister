import axios from "axios";
import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";
export default async function sendLinkToUser(id,email,setResetLink){

    let response=await axios.post(`${GlobalConfig.nodeUrl}/admin/sendLink/${id}`,{
        email:email
    });

    if(response.data.success){
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Reset link sent successfully',
            showConfirmButton: false,
            timer: 2500
        })
        setResetLink("Sent successfully")
    }else{
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error sending reset link',
            showConfirmButton: false,
            timer: 2500
        })
    }

}