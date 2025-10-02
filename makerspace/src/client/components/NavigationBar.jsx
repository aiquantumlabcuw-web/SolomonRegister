import { NavLink } from 'react-router-dom';
import Account from './Account';
import { useState, useEffect } from 'react';
import GlobalConfig from '../../../config/GlobalConfig'; // adjust this path as needed
import Swal from 'sweetalert2';

// Define active/inactive styles for large screens
const activeClassLarge =
  "text-white px-6 py-4 rounded-md text-xs md:text-lg font-medium border-b-2 border-white";
const inactiveClassLarge =
  "text-gray-300 hover:text-white px-6 py-4 rounded-md text-xs md:text-lg font-medium";

// Define active/inactive styles for mobile screens
const activeClassMobile =
  "hover:text-white block px-4 py-2 text-sm text-white bg-blue-600 rounded-md";
const inactiveClassMobile =
  "hover:text-white block px-4 py-2 text-sm text-gray-300";

const NavigationBar = () => {
  // Determine the role from sessionStorage (assumed to be "admin" or "user")
  const role = sessionStorage.getItem("role") || "user";
  
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const userFlip= localStorage.getItem("userFlip") ==="true";
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleChange = () => {
    localStorage.setItem('userFlip', "true");
    window.location.href = "/allTickets";
  }

  // Active and inactive styling for larger screens
  const activeClassLarge =
    "text-[#115175] rounded-full bg-gray-200 px-4 py-1 hover:rounded-full text-xs md:text-sm";
  const inactiveClassLarge =
    "text-gray-200 hover:rounded-full hover:text-[#115175] hover:bg-gray-200 px-4 py-1 rounded-md text-xs md:text-base font-medium";

  // Active and inactive styling for mobile screens
  const activeClassMobile =
    "hover:text-white block px-2 py-1 text-sm text-white bg-blue-600 rounded-md";
  const inactiveClassMobile =
    "hover:text-white block px-2 py-1 text-sm text-gray-300";

  return (
    <nav className="top-0 bg-[#115175] shadow-md z-10">
      <div className="container mx-auto flex items-center justify-between ">
        {/* Logo */}
        <div className="flex-shrink-0">
          <NavLink to="/">
            <img className="h-14 md:h-20" src="/CuwLogo.png" alt="Logo" />
          </NavLink>
        </div>

        {/* Hamburger menu for mobile */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Navigation links for larger screens */}
        {/* Navigation links for larger screens */}
        <div className="hidden md:flex md:items-center md:space-x-4">
        {userFlip || isAdmin && (
            <NavLink
              to="/adminPanel"
              className={({ isActive }) =>
                isActive ? activeClassLarge : inactiveClassLarge
              }
              onClick={handleChange}
            >
              Switch To Admin
            </NavLink>
          )}
          {(localStorage.getItem("token") === "true" ||
            sessionStorage.getItem("token")) && (
              <NavLink
                to="/myTickets"
                className={({ isActive }) =>
                  isActive ? activeClassLarge : inactiveClassLarge
                }
              >
                My Requests
              </NavLink>
            )}
          

          <NavLink
            to="/Tickets"
            className={({ isActive }) =>
              isActive ? activeClassLarge : inactiveClassLarge
            }
            onClick={() => localStorage.setItem("ClickedOnTicket", true)}
          >
            New Request
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive ? activeClassLarge : inactiveClassLarge
            }
          >
            Contact
          </NavLink>
          <NavLink
            to="/FAQs"
            className={({ isActive }) =>
              isActive ? activeClassLarge : inactiveClassLarge
            }
          >
            FAQs
          </NavLink>
          <Account />
        </div>
      </div>

      {/* Dropdown menu for mobile screens */}
      {menuOpen && (
        <div className="md:hidden bg-[#115175]">
          <ul className="flex flex-col items-start space-y-2 p-4">
            {(localStorage.getItem("token") === "true" ||
              sessionStorage.getItem("token")) && (
                <>
                  <li>
                    <NavLink
                      to="/userDashboard"
                      className={({ isActive }) =>
                        isActive ? activeClassMobile : inactiveClassMobile
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/myTickets"
                      className={({ isActive }) =>
                        isActive ? activeClassMobile : inactiveClassMobile
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      My Requests
                    </NavLink>
                  </li>
                </>
              )}
            <li>
              <NavLink
                to="/Tickets"
                className={({ isActive }) =>
                  isActive ? activeClassMobile : inactiveClassMobile
                }
                onClick={() => setMenuOpen(false)}
              >
                Create a Request
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  isActive ? activeClassMobile : inactiveClassMobile
                }
                onClick={() => setMenuOpen(false)}
              >
                Contact
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/FAQs"
                className={({ isActive }) =>
                  isActive ? activeClassMobile : inactiveClassMobile
                }
                onClick={() => setMenuOpen(false)}
              >
                FAQs
              </NavLink>
            </li>
            <li>
              <Account />
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar;
