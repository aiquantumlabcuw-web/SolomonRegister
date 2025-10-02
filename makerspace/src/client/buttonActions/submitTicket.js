import Swal from 'sweetalert2';
import GlobalConfig from "./../../../config/GlobalConfig";
import { useNavigate } from 'react-router-dom';

export async function submitTicket(formData) {

  try {
    const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/submitTicket`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    // Parse the response JSON
    const data = await response.json();

    // Check if the response status is not OK
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit ticket');
    }

    // If successful, show a success alert and navigate
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: data.message,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    }).then(()=>{
      window.location.href="/myTickets"
    })
  } catch (error) {
     if (error === 'Invalid token') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'You need to login correctly to submit a ticket',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      }).then(()=>{
        window.location.href = '/signin';
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }
  } finally {
      //navigate('/myTickets')
  }
}
