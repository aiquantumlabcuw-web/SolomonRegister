import axios from "axios";
import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";
export async function updateNames(firstName,lastName,image){


    const formData = new FormData();
    formData.append('image',image);
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
         
        
        let response= await axios.post(`${GlobalConfig.nodeUrl}/api/updateNames`,formData, {
            headers: {
                'Authorization': sessionStorage.getItem("token")// Replace with your actual token or other headers
            }  
        });

            
         if(response.data.success){
            // alert(response.data.msg);
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: response.data.msg,
                showConfirmButton: false,
                timer: 2500
            });
            setTimeout(() => {
                window.location.reload();
            }, 2500);
            // window.location.reload();
         }
    }   



 