import { z } from 'zod';
import { schema } from '../Validation/zod';
import Swal from 'sweetalert2';
import GlobalConfig from '../../../config/GlobalConfig';

export default async function passwordChange(currpassword, newPassword, repNewPassword, setErrors) {
  const formData = {
    password: currpassword,
    newPassword: newPassword,
    repeatNewPassword: repNewPassword,
  };

  try {
    // Validate using Zod schema
    schema.parse(formData);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const errorMessages = {};

      // Parse specific validation errors
      e.errors.forEach((err) => {
        if (err.path[0] === 'password') {
          errorMessages.currPassword = err.message;
        } else if (err.path[0] === 'newPassword') {
          errorMessages.newPassword = err.message;
        } else if (err.path[0] === 'repeatNewPassword') {
          errorMessages.repNewPassword = err.message;
        }
      });

      // Set the errors in state for display in the UI
      setErrors(errorMessages);
      return;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
      return;
    }
  }

  // Make the API request if validation passes
  let response = await fetch(`${GlobalConfig.nodeUrl}/api/updatepassword`, {
    method: "POST",
    headers: {
      "authorization": sessionStorage.getItem("token"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: currpassword,
      newPassword: newPassword,
    }),
  });

  let data = await response.json();
  if (data.success) {
    window.location.reload();
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: `Password changed successfully`,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  } else {
    setErrors({ warning: data.msg });
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `${data.msg}`,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  }
}
