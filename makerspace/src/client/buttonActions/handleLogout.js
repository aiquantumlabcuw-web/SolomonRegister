import axios from 'axios';
import { setIsAdmin } from '../store/actions';
import GlobalConfig from '../../../config/GlobalConfig';
export const handleLogout = async (dispatch) => {
    try {
        dispatch(setIsAdmin(false));
        localStorage.setItem('isAdmin', false);
        let response = await axios.post(`${GlobalConfig.nodeUrl}/api/logout`, {}, {
            headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            withCredentials: true
        })
        window.location.reload();

    } catch (err) {
        console.error("Error logging out ", err);
    }
}