import axios from "axios"
import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";
export default async function userPassChange(newPassword, repNewPassword, id,setWarning,) {
    
    try {
        if (newPassword != repNewPassword) {
            return Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Passwords do not match',
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true
            })
        }

       
        let response = await axios.put(`${GlobalConfig.nodeUrl}/admin/updateUserPassword/${id}`, {
            newPassword: newPassword
        });

        if (response.data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Password updated successfully',
                showConfirmButton: false,
                timer: 2500
            })
            setWarning("");  
            localStorage.setItem('token', response.data.success);  // Use data.token to store token in localStorage
            sessionStorage.setItem('token', response.data.token);
            setTimeout(() => {
                window.location.href = "/home";
            },2500);
            }else{
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error updating password',
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true
                
            })
            setTimeout(() => {
                window.location.reload();
            },2500);
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
}