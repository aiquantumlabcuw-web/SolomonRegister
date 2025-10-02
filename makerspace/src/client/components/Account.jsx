import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { isLoggedIn } from "../store/atoms/isLoggedIn";
import { handleLogout } from "../buttonActions/handleLogout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faAngleDown } from "@fortawesome/free-solid-svg-icons";

export default function Account() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const isloggedin = useRecoilValue(isLoggedIn);
  const setisloggedin = useSetRecoilState(isLoggedIn);
 
  // Dropdown toggle handlers
  const [isOpen, setIsOpen] = useState(false);
  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200); // Adjust delay for better UX
  };


  if (!isloggedin) {
    return (
      <div
        className="relative z-50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button className="text-gray-200 px-4 sm:px-3 sm:py-2 hover:rounded-full hover:text-[#115175] hover:bg-gray-200 rounded-md text-xs sm:text-base font-medium">
          <FontAwesomeIcon icon={faUser} className="mr-2" />
          Account
          <FontAwesomeIcon icon={faAngleDown} className="ml-1 text-xs" />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute mt-2 right-0 bg-gray-200 rounded-lg shadow-md w-32 z-50">
            <Link to="/signup">
              <button className="block w-full text-[#115175] text-center text-base font-semibold px-1 py-1 hover:rounded-lg hover:bg-[#115175] hover:text-white transition duration-200">
                Sign up
              </button>
            </Link>
            <Link to="/signin">
              <button className="block w-full  text-[#115175] text-center text-base font-semibold px-1 py-1 hover:rounded-lg hover:rounded-lg hover:bg-[#115175] hover:text-white transition duration-200">
                Sign in
              </button>
            </Link>
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div
        className="relative z-50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button className="text-gray-300 hover:rounded-full hover:text-[#115175] hover:bg-gray-200 px-3 py-2 rounded-md text-xs sm:text-base font-medium">
          <FontAwesomeIcon icon={faUser} className="mr-2" />
          Account
          <FontAwesomeIcon icon={faAngleDown} className="ml-1 text-xs" />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute mt-2 right-0 bg-gray-100 rounded-lg shadow-md w-44 z-50">

            <Link to="/accountdetails">
              <button className="block w-full text-left text-sm font-bold px-4 py-1 text-[#115175] hover:rounded-lg hover:bg-[#115175] hover:text-white transition duration-200">
                Account details
              </button>
            </Link>
            <Link to="/passwordchange">
              <button className="block w-full text-left text-sm font-bold px-4 py-1  text-[#115175] hover:rounded-lg hover:bg-[#115175] hover:text-white transition duration-200">
                Password change
              </button>
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("token"); // Instead of setting it to "false"
                localStorage.removeItem("isAdmin");
                sessionStorage.removeItem("token");
                // localStorage.removeItem("userFlip")
                setisloggedin(false);

                handleLogout(dispatch);
                navigate("/signin");
                window.location.reload();
              }}
              className="block w-full text-left text-sm font-bold px-4 py-1  text-[#115175] hover:rounded-lg hover:bg-[#115175] hover:text-white transition duration-200"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }
}
