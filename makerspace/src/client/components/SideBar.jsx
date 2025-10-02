import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { isLoggedIn } from "../store/atoms/isLoggedIn";
import { useSetRecoilState } from "recoil";
import { FaTachometerAlt,FaUserShield, FaTicketAlt, FaKey, FaUsers, FaUser, FaDatabase, FaEnvelope, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { RiQuestionnaireFill } from 'react-icons/ri';
import { AiFillHome } from 'react-icons/ai';
import React, { useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
// Define the drag types
const ItemTypes = {
  MENU: 'menu',
  SUBMENU: 'submenu'
};

const DraggableMenuItem = ({ menu, index, moveMenu, activeMenu, handleMenuClick, open, children }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.MENU,
    item: { index, id: menu.title, type: ItemTypes.MENU },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.MENU,
    hover: (item, monitor) => {
      if (item.index !== index) {
        moveMenu(item.index, index);
        item.index = index;
      }
    },
  });

  const iconElement = (
    <span className="text-xl w-5 text-center">
      {open && menu.icon}
    </span>
  );

  const titleElement = (
    <span className={`${!open && "hidden"} origin-left duration-200`}>
      {menu.title}
    </span>
  );

  // Action button (non-dropdown)
  if (menu.action) {
    return (
      <li
        ref={(node) => drag(drop(node))}
        className={`relative ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        style={{ cursor: 'move' }}
      >
        <button
          onClick={menu.action}
          className={`flex rounded-md pl-6 p-2 text-white font-bold text-sm items-center gap-x-4 cursor-pointer
          ${menu.gap ? "mt-9" : "mt-2"} ${index === 0 && "bg-light-white"}`}
        >
          {iconElement}
          {titleElement}
        </button>
      </li>
    );
  }

  // Link item (non-dropdown)
  if (!menu.isDropdown) {
    return (
      <li
        ref={(node) => drag(drop(node))}
        className={`relative ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        style={{ cursor: 'move' }}
      >
        <Link
          to={menu.path}
          className={`flex rounded-md pl-6 p-2 text-white font-bold text-sm items-center gap-x-4 cursor-pointer
          ${menu.gap ? "mt-9" : "mt-2"} ${index === 0 && "bg-light-white"}`}
        >
          {iconElement}
          {titleElement}
        </Link>
      </li>
    );
  }

  // Dropdown item
  return (
    <li
      ref={(node) => drag(drop(node))}
      className={`relative ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ cursor: 'move' }}
    >
      <div
        className={`flex rounded-md pl-6 p-2 text-white font-bold text-sm items-center gap-x-4 cursor-pointer
        ${menu.gap ? "mt-9" : "mt-2"} ${index === 0 && "bg-light-white"}`}
        onClick={() => handleMenuClick(menu.title)}
      >
        {iconElement}
        <div className="flex items-center justify-between w-full">
          {titleElement}
          {open && (
            <span className="ml-auto">
              {activeMenu === menu.title ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          )}
        </div>
      </div>
      {children}
    </li>
  );
};


// Draggable SubMenu Item Component
const DraggableSubMenuItem = ({ subItem, index, moveSubItem, menuIndex, submenuLength }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SUBMENU,
    item: {
      index,
      menuIndex,
      id: subItem.title,
      type: ItemTypes.SUBMENU
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.SUBMENU,
    hover: (item, monitor) => {
      if (item.menuIndex === menuIndex && item.index !== index) {
        moveSubItem(item.menuIndex, item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <li
      ref={(node) => drag(drop(node))}
      className={`py-2 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ cursor: 'move' }}
    >
      {subItem.action ? (
        <button
          onClick={subItem.action}
          className="text-black py-1 hover:bg-[#115175] hover:text-white text-sm block pl-12 w-full text-left cursor-pointer"
        >
          {subItem.title}
        </button>
      ) : (
        <Link
          to={subItem.path}
          className="text-black py-1 hover:bg-[#115175] hover:text-white text-sm block pl-12 w-full cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {subItem.title}
        </Link>
      )}
    </li>
  );
};

// Drop target for submenus to be moved between menus
const SubMenuContainer = ({ menuIndex, children, onDrop }) => {
  const [, drop] = useDrop({
    accept: ItemTypes.SUBMENU,
    drop: (item) => {
      if (item.menuIndex !== menuIndex) {
        onDrop(item.menuIndex, item.index, menuIndex);
        return { moved: true };
      }
      return undefined;
    },
  });

  return (
    <ul ref={drop} className="bg-white rounded-md ">
      {children}
    </ul>
  );
};

const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [menus, setMenus] = useState([]);

  const setisloggedin = useSetRecoilState(isLoggedIn);
  const dispatch = useDispatch();

  const handleLogout = useCallback(() => {
    window.location.href = "/signin";
    localStorage.setItem("token", "false");
    localStorage.setItem("isAdmin","false");
    localStorage.setItem('userFlip', "false");
    sessionStorage.setItem("token", "");
    setisloggedin(false);
  }, [setisloggedin]);

  const handleChangeToUser = useCallback(() => {
    localStorage.setItem("userFlip", "false");
    window.location.href = "/myTickets";
  }, []);

  // Define default menus with a function that has access to the latest handlers
  const getDefaultMenus = useCallback(() => {
    return [
      {
        title: "Request Management",
        iconName: "FaTicketAlt",
        isDropdown: true,
        subMenu: [
          { title: "View All Requests", path: "/allTickets" },
        ],
      },
      {
        title:"Admin Management",
        iconName:"FaUserShield",
        isDropdown:true,
        subMenu:[
          {title:"Admin Emailer",src: "AdminEmailer",path: "/admin-emailer" },
          { title: "Failed Login", src: "FailedLogin", path: "/failed-login" },
          { title: "Email Editor", src: "EmailEditor", path: "/email-editor" },
        ]
      },
      {
        title: "User Management",
        iconName: "FaUsers",
        isDropdown: true,
        subMenu: [
          { title: "Switch to User", actionName: "handleChangeToUser" },
          { title: "View All Users", path: "/allUsers" },
        ],
      },
      {
        title: "Dashboard",
        iconName: "FaTachometerAlt",
        path: "/adminPanel"
      },
      {
        title: "Access Control & Permissions",
        iconName: "FaKey",
        isDropdown: true,
        subMenu: [
          { title: "Create Privilege", path: "/add-privilege" },
          { title: "View All Privileges", path: "/view-privilege" },
          { title: "Assign Role to Privilege", path: "/link-role-privilege" },
          { title: "View Roles", path: "/view-roles" },
          { title: "Create Role", path: "/add-role" },
        ],
      },
      {
        title: "Support & Communication",
        iconName: "FaEnvelope",
        isDropdown: true,
        subMenu: [
          { title: "Contact & Questions", path: "/ContactQuestions" },
          { title: "Admin Email Management", path: "/adminEmailer" },
        ],
      },
      {
        title: "System Maintenance & Backup",
        iconName: "FaDatabase",
        isDropdown: true,
        subMenu: [
          { title: "Backup and Restore Guide", path: "/backupRestore" },
        ],
      },
      {
        title: "SIGN OUT",
        iconName: "AiFillHome",
        actionName: "handleLogout" 
      },
    ];
  }, []);

  // Function to get icon component by name
  const getIconComponent = useCallback((iconName) => {
    switch (iconName) {
      case 'FaTicketAlt': return <FaTicketAlt />;
      case 'FaUsers': return <FaUsers />;
      case 'FaTachometerAlt': return <FaTachometerAlt />;
      case 'FaKey': return <FaKey />;
      case 'FaEnvelope': return <FaEnvelope />;
      case 'FaDatabase': return <FaDatabase />;
      case 'AiFillHome': return <AiFillHome />;
      case 'FaUserShield': return <FaUserShield />; // 👈 Admin icon
      default: return null;
    }
  }, []);

  // Function to get action handler by name
  const getActionHandler = useCallback((actionName) => {
    switch (actionName) {
      case 'handleLogout': return handleLogout;
      case 'handleChangeToUser': return handleChangeToUser;
      default: return () => console.log(`Action ${actionName} not found`);
    }
  }, [handleLogout, handleChangeToUser]);

  // Process menu items to add React elements and functions
  const processMenuItems = useCallback((menuItems) => {
    return menuItems.map(menu => {
      const processedMenu = { ...menu };
      
      // Convert iconName to icon component
      if (menu.iconName) {
        processedMenu.icon = getIconComponent(menu.iconName);
      }
      
      // Convert actionName to action function
      if (menu.actionName) {
        processedMenu.action = getActionHandler(menu.actionName);
      }
      
      // Process subMenu items if they exist
      if (menu.subMenu && menu.subMenu.length > 0) {
        processedMenu.subMenu = menu.subMenu.map(subItem => {
          const processedSubItem = { ...subItem };
          
          if (subItem.actionName) {
            processedSubItem.action = getActionHandler(subItem.actionName);
          }
          
          return processedSubItem;
        });
      }
      
      return processedMenu;
    });
  }, [getIconComponent, getActionHandler]);

  // Save menu structure to localStorage (only the serializable parts)
  const saveMenusToLocalStorage = useCallback((menuItems) => {
    // Only save properties that can be serialized
    const serializableMenus = menuItems.map(menu => {
      const { icon, action, ...serializableMenu } = menu;
      return serializableMenu;
    });
    
    localStorage.setItem('sidebarMenus', JSON.stringify(serializableMenus));
  }, []);

  // Initialize menus state
  useEffect(() => {
    try {
      // Try to get menu order from localStorage
      const savedMenusStr = localStorage.getItem('sidebarMenus');
      
      if (savedMenusStr) {
        // Parse saved menus
        const savedMenus = JSON.parse(savedMenusStr);
        // Process them to add back React elements and functions
        const processedMenus = processMenuItems(savedMenus);
        setMenus(processedMenus);
      } else {
        // Use default menus if nothing saved
        const defaultMenus = getDefaultMenus();
        const processedDefaultMenus = processMenuItems(defaultMenus);
        setMenus(processedDefaultMenus);
      }
    } catch (error) {
      console.error("Error loading menus:", error);
      // Fallback to defaults on error
      const defaultMenus = getDefaultMenus();
      const processedDefaultMenus = processMenuItems(defaultMenus);
      setMenus(processedDefaultMenus);
    }
  }, [getDefaultMenus, processMenuItems]);

  // Handle menu click
  const handleMenuClick = useCallback((menuTitle) => {
    setActiveMenu(activeMenu === menuTitle ? null : menuTitle);
  }, [activeMenu]);

  // Move a menu item to a new position
  const moveMenu = useCallback((dragIndex, hoverIndex) => {
    setMenus((prevMenus) => {
      const newMenus = [...prevMenus];
      const draggedMenu = newMenus[dragIndex];
      newMenus.splice(dragIndex, 1);
      newMenus.splice(hoverIndex, 0, draggedMenu);
      
      // Save to localStorage after updating
      saveMenusToLocalStorage(newMenus);
      
      return newMenus;
    });
  }, [saveMenusToLocalStorage]);

  // Move a submenu item within the same menu
  const moveSubItem = useCallback((menuIndex, dragIndex, hoverIndex) => {
    setMenus((prevMenus) => {
      const newMenus = [...prevMenus];
      const menu = { ...newMenus[menuIndex] };
      const draggedItem = menu.subMenu[dragIndex];

      const newSubMenu = [...menu.subMenu];
      newSubMenu.splice(dragIndex, 1);
      newSubMenu.splice(hoverIndex, 0, draggedItem);

      menu.subMenu = newSubMenu;
      newMenus[menuIndex] = menu;
      
      // Save to localStorage after updating
      saveMenusToLocalStorage(newMenus);
      
      return newMenus;
    });
  }, [saveMenusToLocalStorage]);

  // Move a submenu item to a different menu
  const moveSubItemBetweenMenus = useCallback((sourceMenuIndex, sourceItemIndex, targetMenuIndex) => {
    setMenus((prevMenus) => {
      const newMenus = [...prevMenus];
      const sourceMenu = { ...newMenus[sourceMenuIndex] };
      const itemToMove = sourceMenu.subMenu[sourceItemIndex];

      sourceMenu.subMenu = sourceMenu.subMenu.filter((_, index) => index !== sourceItemIndex);
      newMenus[sourceMenuIndex] = sourceMenu;

      const targetMenu = { ...newMenus[targetMenuIndex] };
      targetMenu.subMenu = [...targetMenu.subMenu, itemToMove];
      newMenus[targetMenuIndex] = targetMenu;
      
      // Save to localStorage after updating
      saveMenusToLocalStorage(newMenus);
      
      return newMenus;
    });
  }, [saveMenusToLocalStorage]);

  // Reset menu order to default
  const resetMenuOrder = useCallback(() => {
    localStorage.removeItem('sidebarMenus');
    const defaultMenus = getDefaultMenus();
    const processedDefaultMenus = processMenuItems(defaultMenus);
    setMenus(processedDefaultMenus);
  }, [getDefaultMenus, processMenuItems]);

  const ToggleIcon = useCallback(() => {
  return (
    <button
     className={`h-20 w-6 border border-gray-500 ${open ? 'bg-red-600' : 'bg-[#115175]'} flex items-center justify-center`}
  style={{
    clipPath: 'polygon(0% 0%, 130% 50%, 0% 100%)'
  }}
    >
      {open ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path   strokeWidth={4} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-4 text-white " fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path    strokeWidth={4} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}, [open]);


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex">
        <div className={`${open ? "w-60" : "w-4"} bg-[#115175] h-screen relative duration-300`}>
          {/* New centered toggle button */}
          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
            <button 
              onClick={() => setOpen(!open)} 
              className="flex items-center justify-center  focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors duration-200"
            >
              <ToggleIcon />
            </button>
          </div>
          
          <div className="flex h-10 mt-2 justify-center items-center">
            <h1 className={`text-white text-center font-medium text-xl duration-200 ${!open && "scale-0"}`}>
              Admin
            </h1>
          </div>

          <ul className="mt-10">
            {menus.map((menu, index) => (
              <DraggableMenuItem
                key={`${menu.title}-${index}`}
                menu={menu}
                index={index}
                moveMenu={moveMenu}
                activeMenu={activeMenu}
                handleMenuClick={handleMenuClick}
                open={open}
              >
                {/* Submenu items */}
                {activeMenu === menu.title && open && menu.subMenu && (
                  <SubMenuContainer
                    menuIndex={index}
                    onDrop={moveSubItemBetweenMenus}
                  >
                    {menu.subMenu.map((subItem, subIndex) => (
                      <DraggableSubMenuItem
                        key={`${subItem.title}-${subIndex}`}
                        subItem={subItem}
                        index={subIndex}
                        menuIndex={index}
                        moveSubItem={moveSubItem}
                        submenuLength={menu.subMenu?.length || 0}
                      />
                    ))}
                  </SubMenuContainer>
                )}
              </DraggableMenuItem>
            ))}
          </ul>
          
          {/* Reset button - only visible when expanded */}
          {open && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button 
                onClick={resetMenuOrder} 
                className="text-white text-xs hover:underline"
              >
                Reset menu order
              </button>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default Sidebar;
