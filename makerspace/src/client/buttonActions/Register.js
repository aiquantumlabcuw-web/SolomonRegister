import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";
export async function Register(email,password,repeatPassword,setIsLoggedInS,navigate){  // Check if passwords match
  if (password !== repeatPassword) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Passwords do not match',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
    return;
  }

  // Attempt to register the user
  let response = await fetch(`${GlobalConfig.nodeUrl}/api/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  let data = await response.json();

  // Handle successful registration
  if (data.success) {
    localStorage.setItem("token", true);
    sessionStorage.setItem("token", data.token);
    setIsLoggedInS(true);
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'You have successfully registered',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
    navigate("/home");
  } else {
    // Handle error when email is already registered
    Swal.fire({
      icon: 'warning',
      title: 'Email Already Registered',
      text: 'This email is already associated with an account.',
      showCancelButton: true,
      confirmButtonText: 'Sign In',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/signin"); // Navigate to the sign-in page
      }
    });
  }
}
