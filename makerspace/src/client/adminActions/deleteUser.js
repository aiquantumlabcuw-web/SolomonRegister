import axios from "axios";
import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";
export default async function deleteTheUser(email,id){

    try{
        let response= await axios.post(`${GlobalConfig.nodeUrl}/admin/deleteUser/${id}`,{
            email:email
        });

            if(response.data.success){
              
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'User deleted successfully',
                    showConfirmButton: false,
                    timer: 2500
                });
                window.location.href="/allUsers";
            }else{
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error deleting user',
                    showConfirmButton: false,
                    timer: 2500
                });
                window.location.reload();
            }
    }catch(err){
        console.error('Error updating user:', err);
    }
}