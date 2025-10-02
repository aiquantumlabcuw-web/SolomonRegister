import axios from "axios";
import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";
export default async function userUpdate(email,firstName,lastName,id,role,image){

  
      
    if (
        !email.trim() &&       // True if email is empty
        !firstName.trim() &&   // True if first name is empty
        !lastName.trim() &&    // True if last name is empty              
        !role.trim() &&        // True if role is empty
        !image                  // True if image is null
    ) {
        Swal.fire({
            icon: 'error',
            title: 'Input Error',
            text: 'No fields are selected ',
            showConfirmButton: false,
            timer:1200
        });
        return; // Exit the function if all fields are empty
    }
    
    


    const formData = new FormData();
    formData.append('image', image);
    formData.append('email', email);
    formData.append('role_name', role);
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
  
    
    try {
       let response= await axios.put(`${GlobalConfig.nodeUrl}/admin/updateUser/${id}`,formData, {
            headers: {
                'Authorization': sessionStorage.getItem("token")// Replace with your actual token or other headers
            }  
        }
        
     );

        if(response.data.success){
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'User updated',
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true
            });
          
            setTimeout(() => {
                window.location.href= `/edit-user/${id}`
        },2500);    
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
}