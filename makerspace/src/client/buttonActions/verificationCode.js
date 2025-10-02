import Swal from 'sweetalert2'
import GlobalConfig from "../../../config/GlobalConfig";
export default async function verificationCode(digit1,digit2,digit3,digit4,digit5,digit6,email,setWarning,navigate){

    let code=digit1+digit2+digit3+digit4+digit5+digit6
    console.log(code)
    if(code==null || code==""){
      setWarning("input field cannot be empty")
      return
    }else if(code.length < 6){
      setWarning("You have not entered 6-digit code")
      return
    }
    setWarning("")
    let response= await fetch(`${GlobalConfig.nodeUrl}api/reset-password`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },body:JSON.stringify({
          resetCode:code,  
          email:email
        })
      })
      let data=await response.json();
      if(data.success){

        // alert(data.msg);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.msg,
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar : true,
      });
        // sessionStorage.removeItem("Fkey");
        // window.location.href = "/signin";
        setTimeout(() => {
          window.location.reload();
      })
        // navigate("/forgotpassword")
      }else{
        setWarning(data.msg);
      }
}