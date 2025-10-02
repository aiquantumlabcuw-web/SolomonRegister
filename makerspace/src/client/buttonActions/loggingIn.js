import axios from 'axios';
import { setIsAdmin } from '../store/actions/actions';
import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";

export const LogginIn = async (email, password, setIsLoggedInS, navigate, setWarning, dispatch) => {
    return axios.post(
        `${GlobalConfig.nodeUrl}/api/signin`,
        { email, password },
        { withCredentials: true }  // → send cookies if any
    )
    .then(async response => {
        const data = response.data;
        // console.log('data',data)
        if (data.success) {
            setWarning("");  
            setIsLoggedInS(true);
            const isAdmin = data.isAdmin || false;

            localStorage.setItem('token', data.success);  // Store token in localStorage
            sessionStorage.setItem('token', data.token);
            localStorage.setItem('isAdmin', isAdmin);
            localStorage.setItem('userFlip',isAdmin);
            dispatch(setIsAdmin(isAdmin));
            
            // Show success alert with Swal.fire
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'You have successfully logged in',
                showConfirmButton: false,
                timer: 1000,
                timerProgressBar: true,
            });
            if(localStorage.getItem("ClickedOnTicket")=== "true"){
                isAdmin ? navigate('/allTickets') : navigate('/Tickets')
                localStorage.setItem("ClickedOnTicket",false)
            }else{
                isAdmin ? navigate('/allTickets') : navigate('/myTickets')
            }
            setTimeout(() => {
                window.location.reload();
            },1000);    
        
        } else {
            setWarning(data.msg);
        }
        return response;
    })
    .catch(async error => {
        // Handle HTTP 423 (Locked) first
        if (error.response && error.response.status === 423) {
            const mins = error.response.data.remainingMinutes;
            let blockMsg;
            if (typeof mins === 'number' && mins !== Infinity && mins > 0) {
                blockMsg = `Your account has been blocked for ${mins} more minute${mins !== 1 ? 's' : ''}. Please wait or contact support.`;
            } else {
                blockMsg = 'Your account has been blocked. Please wait or contact support.';
            }
            await Swal.fire({
                icon: 'error',
                title: 'Blocked',
                text: blockMsg,
                showConfirmButton: false,
                timer: 3000,
            });
            setWarning(blockMsg);
            return;
        }
        const err = error.response;
        // 2) Blocked (429)
        if (err.status === 429) {
            let blockMsg = '';
            const duration = error.response.data.duration;
            const failedAttempts = error.response.data.failedAttempts;
            const threshold = error.response.data.thresholdReached;
            const ruleName = error.response.data.ruleName;
            if (duration && failedAttempts && threshold && ruleName) {
                blockMsg = `Your account has been blocked after ${failedAttempts} failed attempts (threshold: ${threshold}, rule: ${ruleName}). Please try again in ${duration}.`;
            } else if (duration) {
                blockMsg = `Your account has been blocked. Please try again in ${duration}.`;
            } else {
                blockMsg = 'Your account has been blocked. Please wait or contact support.';
            }
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: blockMsg,
                showConfirmButton: false,
                timer: 2500,
            });
            setWarning(blockMsg);
            return;
        }
        // 3) Forbidden (403)
        if (err.status === 403 && err.data.msg === "You have entered the wrong password") {
         return
        }
        if (err.status === 403) {
            let blockMsg = '';
            const duration = error.response.data.duration;
            const failedAttempts = error.response.data.failedAttempts;
            const threshold = error.response.data.thresholdReached;
            const ruleName = error.response.data.ruleName;
            const remainingMinutes = error.response.data.remainingMinutes;
            const message = error.response.data.msg;
            if (duration && failedAttempts && threshold && ruleName) {
                blockMsg = `Your account has been blocked after ${failedAttempts} failed attempts (threshold: ${threshold}, rule: ${ruleName}). Please try again in ${duration}.`;
            } else if (duration) {
                blockMsg = `Your account has been blocked. Please try again in ${duration}.`;
            } else if( remainingMinutes) {
                blockMsg =  `Your account has been blocked. Please try again in ${remainingMinutes} minutes`;
            }
            else if(message){
                blockMsg = message;
            }                
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: blockMsg,
                showConfirmButton: false,
                timer: 2500,
            });
            setWarning(blockMsg);
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error during sign-in. An error occurred. Please try again. ${error.message}`,
                showConfirmButton: false,
                timer: 2500,
            });
        }
    });
}
