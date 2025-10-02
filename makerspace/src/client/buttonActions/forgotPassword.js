import { z } from "zod";
import { forgotPassSchema } from "../Validation/zod";
import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";
export default async function forgotPassword(email, newPassword,repNewPassword,setWarning,navigate ){

      console.log(email,newPassword,repNewPassword)
  const formData = {
        newPassword: newPassword,
        repeatNewPassword: repNewPassword
      };
      console.log(formData)
      try {
        forgotPassSchema.parse(formData);
      } catch (e) {
        if (e instanceof z.ZodError) {
          setWarning("Validation failed: Follow the above rules / Both the fields must be same")
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Validation failed: Follow the above rules / Both the fields must be same',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
        });
          // alert("Validation failed: Follow the below rules");
          return;
        } else {
          setWarning("An unexpected error occurred")
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An unexpected error occurred',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
        });
          // alert("An unexpected error occurred");
          return;
        }
      }
      setWarning("");
      

      let response= await fetch(`${GlobalConfig.nodeUrl}/api/forgot-password`,{
        method:"POST",
        headers:{
          "authorization":sessionStorage.getItem("Fkey"),
          "Content-Type":"application/json"
        },body:JSON.stringify({
          email:email,
          newPassword:newPassword
        })
      })

      let data=await response.json();
      if(data.success==false){
          setWarning(data.msg);
      }else{
         sessionStorage.removeItem("Fkey");
        //  alert(data.msg)
        //  navigate("/signin")
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: data.msg,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
        });
        navigate("/signin")


      }
}