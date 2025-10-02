import React, { useState, useEffect, useMemo, useRef } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import data from './../assets/data.json';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import GlobalConfig from '../../../config/GlobalConfig';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faFilter, faEye } from '@fortawesome/free-solid-svg-icons';
import { FaRegCommentDots, FaTimes, FaPaperclip, FaUserShield, FaUser, FaRobot } from 'react-icons/fa';

// Set Modal app element for accessibility
Modal.setAppElement('#root');

const AllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstRender = useRef(true); // Track first render

  // Filters – note we now add a messageStatus filter as well
  const [filters, setFilters] = useState({
    priority: '',
    department: '',
    ticketType: '',
    role: '',
    status: '',
    messageStatus: '' // "read" or "unread"
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting state
  const [sorting, setSorting] = useState("new-to-old");
  const statusPriority = { Open: 1, 'In Progress': 2, Ready: 3, Shipped: 4, Closed: 5 };

  // State for unread counts (computed from fetched comments)
  const [unreadCounts, setUnreadCounts] = useState({});

  // Chat modal state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentTicketForChat, setCurrentTicketForChat] = useState(null);
  const messagesEndRef = useRef(null);

  // State for caching the tickets data
  const [cachedTickets, setCachedTickets] = useState([]);
  const [cacheTimestamp, setCacheTimestamp] = useState(0);

  const [showFilters, setShowFilters] = useState(false);

  // Restore filters and search term from URL parameters
  useEffect(() => {
    // Skip this effect if we're handling a back navigation from ticket details
    if (location.state?.fromTicketDetail) {
      return;
    }
    
    const statusQuery = searchParams.get("status");
    const messageStatusQuery = searchParams.get("messageStatus");
    const pageQuery = searchParams.get("page");
    const sortQuery = searchParams.get("sort");
    const departmentQuery = searchParams.get("department");
    const ticketTypeQuery = searchParams.get("ticketType");
    const roleQuery = searchParams.get("role");
    const searchTermQuery = searchParams.get("searchTerm");

    // Track if any state will actually change to avoid unnecessary updates
    let stateChanged = false;
    const newFilters = { ...filters };
    
    if (statusQuery && newFilters.status !== statusQuery) {
      newFilters.status = statusQuery;
      stateChanged = true;
    }
    if (messageStatusQuery && newFilters.messageStatus !== messageStatusQuery) {
      newFilters.messageStatus = messageStatusQuery;
      stateChanged = true;
    }
    if (departmentQuery && newFilters.department !== departmentQuery) {
      newFilters.department = departmentQuery;
      stateChanged = true;
    }
    if (ticketTypeQuery && newFilters.ticketType !== ticketTypeQuery) {
      newFilters.ticketType = ticketTypeQuery;
      stateChanged = true;
    }
    if (roleQuery && newFilters.role !== roleQuery) {
      newFilters.role = roleQuery;
      stateChanged = true;
    }
    
    // Only update filters if something changed
    if (stateChanged) {
      setFilters(newFilters);
    }

    // Set pagination and sorting
    if (pageQuery && currentPage !== Number(pageQuery)) {
      setCurrentPage(Number(pageQuery));
    }
    
    if (sortQuery && sorting !== sortQuery) {
      setSorting(sortQuery);
    } else if (!sortQuery) {
      // Only set from localStorage if URL doesn't have sorting parameter
      const savedSorting = localStorage.getItem('allTicketsSorting');
      if (savedSorting && sorting !== savedSorting) {
        setSorting(savedSorting);
      }
    }

    // Set search term if present
    if (searchTermQuery && searchTerm !== searchTermQuery) {
      setSearchTerm(searchTermQuery);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.state]);

  // Update URL when page, sorting, filters or search term changes
  useEffect(() => {
    // Skip on first render and if we're currently restoring state 
    if (isFirstRender.current || sessionStorage.getItem('lastVisitedTicketPage')) {
      isFirstRender.current = false;
      return;
    }
    
    // Create a new URLSearchParams object
    const params = new URLSearchParams();
    
    // Only include parameters that have values
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    if (sorting && sorting !== "new-to-old") { // Don't include default sorting
      params.set('sort', sorting);
    }
    
    // Add filter parameters that have values
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    // Add search term if present
    if (searchTerm) {
      params.set('searchTerm', searchTerm);
    }
    
    // Get the current search string and compare with new one to avoid unnecessary updates
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    
    if (newSearch !== currentSearch) {
      // Only update URL if the parameters actually changed
      setSearchParams(params, { replace: true });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sorting, filters, searchTerm]);

  // Check if we're coming back from a ticket detail page
  useEffect(() => {
    // Look for saved page/state in sessionStorage (more reliable than router state)
    const lastVisitedPage = sessionStorage.getItem('lastVisitedTicketPage');
    
    if (lastVisitedPage) {
      // Parse the URL to extract parameters
      try {
        // Create a URL object to easily extract parameters
        const url = new URL(window.location.origin + lastVisitedPage);
        const params = url.searchParams;
        
        // Extract and set the pagination, sorting and filters
        let stateChanged = false;
        const newFilters = { ...filters };
        
        // Set page
        const pageParam = params.get('page');
        if (pageParam && currentPage !== Number(pageParam)) {
          setCurrentPage(Number(pageParam));
          stateChanged = true;
        }
        
        // Set sorting
        const sortParam = params.get('sort');
        if (sortParam && sorting !== sortParam) {
          setSorting(sortParam);
          stateChanged = true;
        }
        
        // Set filters
        ['status', 'messageStatus', 'department', 'ticketType', 'role'].forEach(key => {
          const value = params.get(key);
          if (value && newFilters[key] !== value) {
            newFilters[key] = value;
            stateChanged = true;
          }
        });
        
        // Set search term
        const searchTermParam = params.get('searchTerm');
        if (searchTermParam && searchTerm !== searchTermParam) {
          setSearchTerm(searchTermParam);
        }
        
        // Update filters if needed
        if (stateChanged) {
          setFilters(newFilters);
        }
        
        // Clear the sessionStorage to prevent issues on subsequent navigation
        sessionStorage.removeItem('lastVisitedTicketPage');
      } catch (err) {
        console.error('Error restoring state from URL:', err);
      }
    }
  }, []); // Run only once on component mount

  // Fetch tickets and compute unread counts
  useEffect(() => {
    const fetchRequests = async () => {
      // Check if we should use cached data
      const returnTime = sessionStorage.getItem('ticketListReturnTime');
      const isReturningFromDetails = location.state?.fromTicketDetail && location.state?.skipReload;
      const hasCachedData = cachedTickets.length > 0;
      const isCacheRecent = returnTime && (Date.now() - parseInt(returnTime)) < 30000; // 30 seconds cache validity
      
      // If we're returning from ticket details and have recent cached data, use it
      if (isReturningFromDetails && hasCachedData && isCacheRecent) {
        console.log('Using cached request data');
        // Clear the return flag
        sessionStorage.removeItem('ticketListReturnTime');
        return;
      }
      
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          searchTerm,
          ...filters
        }).toString();

        const response = await fetch(
          `${GlobalConfig.nodeUrl}/ticket/getAllTickets?${queryParams}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const fetchedRequests = await response.json();

        // Sorting logic - sort based on request creation time
        let sortedRequests = [...fetchedRequests];
        if (sorting === 'new-to-old') {
          // Sort based on request creation time only
          sortedRequests.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        } else if (sorting === 'old-to-new') {
          sortedRequests.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sorting === 'status') {
          sortedRequests.sort((a, b) => (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99));
        } else if (sorting === 'request-type-ascending') {
          sortedRequests.sort((a, b) => a.ticketType.localeCompare(b.ticketType));
        } else if (sorting === 'request-type-descending') {
          sortedRequests.sort((a, b) => b.ticketType.localeCompare(a.ticketType));
        }
        
        // Update both the display state and the cache
        setRequests(sortedRequests);
        setCachedTickets(sortedRequests);
        setCacheTimestamp(Date.now());

        // Fetch message status for all requests in a single batch - more efficient
        try {
          const requestIds = sortedRequests.map(request => request._id);
          const messageStatusResponse = await fetch(`${GlobalConfig.nodeUrl}/ticket/getMessageStatus`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ticketIds: requestIds })
          });
          
          if (messageStatusResponse.ok) {
            const messageStatuses = await messageStatusResponse.json();
            // Set the unread counts based on the response
            setUnreadCounts(messageStatuses);
          } else {
            // Fallback to the existing method if the batch API fails
            const counts = {};
            for (const request of sortedRequests) {
              try {
                const res = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${request._id}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                });
                if (res.ok) {
                  const comments = await res.json();
                  // Count messages where messageStatus.admin is 'unread'
                  const count = comments.filter(c => c.messageStatus && c.messageStatus.admin === 'unread').length;
                  counts[request._id] = count;
                } else {
                  counts[request._id] = 0;
                }
              } catch (err) {
                counts[request._id] = 0;
              }
            }
            setUnreadCounts(counts);
          }
        } catch (error) {
          console.error("Error fetching message status:", error);
          // Initialize with zeros if we can't fetch the message status
          const defaultCounts = {};
          sortedRequests.forEach(request => {
            defaultCounts[request._id] = 0;
          });
          setUnreadCounts(defaultCounts);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [searchTerm, filters, sorting, location.state]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const handleSortingChange = (e) => {
    const newSorting = e.target.value;
    setSorting(newSorting);
    localStorage.setItem('allTicketsSorting', newSorting);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStatusChange = async (id, status) => {
    // Save the previous status for rollback if needed
    const ticketToUpdate = tickets.find(ticket => ticket._id === id);
    const previousStatus = ticketToUpdate ? ticketToUpdate.status : '';

    // Update UI immediately for a responsive feel
    setTickets(prev => prev.map(ticket => 
      ticket._id === id ? { ...ticket, status } : ticket
    ));

    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/updateStatus/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Get the updated ticket from server response
      const updatedTicket = await response.json();
      // Ensure the server state is reflected in the UI
      setTickets(prev => prev.map(ticket => 
        ticket._id === id ? updatedTicket : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
      // Revert the UI change if the API call failed
      setTickets(prev => prev.map(ticket => 
        ticket._id === id ? { ...ticket, status: previousStatus } : ticket
      ));
      
      // Optionally show an error message to the user
      Swal.fire({
        icon: 'error',
        title: 'Status Update Failed',
        text: 'Failed to update ticket status. Please try again.'
      });
    }
  };

  // Chat Modal Handlers
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchChatMessages = async (ticket) => {
    setLoading(true);
    try {
      const res = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${ticket._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const msgs = await res.json();
      setChatMessages(msgs);
      
      // Need to scroll after messages render
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openChatModal = async (ticket) => {
    setCurrentTicketForChat(ticket);
    await fetchChatMessages(ticket);
    try {
      await fetch(`${GlobalConfig.nodeUrl}/ticket/markMessagesAsRead/${ticket._id}?role=admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setUnreadCounts(prev => ({ ...prev, [ticket._id]: 0 }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
    setChatModalOpen(true);
  };

  const closeChatModal = () => {
    setChatModalOpen(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    
    // Create a temporary ID for optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const currentTime = new Date();
    
    // Prepare the new message
    const tempMessage = {
      _id: tempId,
      message: newMessage,
      from: 'admin',
      createdAt: currentTime,
      // Add any other necessary fields with placeholder values
      messageStatus: { admin: 'read', user: 'unread' }
    };
    
    // Optimistically update UI
    setChatMessages(prev => [...prev, tempMessage]);
    
    // Clear input field immediately for better UX
    const messageToSend = newMessage;
    const fileToSend = selectedFile;
    setNewMessage('');
    setSelectedFile(null);
    
    // Scroll to show the new message
    setTimeout(() => {
      scrollToBottom();
    }, 50);
    
    try {
      const formData = new FormData();
      formData.append('ticketID', currentTicketForChat._id);
      formData.append('message', messageToSend);
      formData.append('from', 'admin');
      if (fileToSend) {
        formData.append('file', fileToSend);
      }
      
      // Set loading but don't impact the entire chat screen
      const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/submitcomment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }
      
      // Replace the temp message with the actual message from the server
      // or just fetch all messages to be safe
      const res = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${currentTicketForChat._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to refresh messages');
      const msgs = await res.json();
      setChatMessages(msgs);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the temp message on error
      setChatMessages(prev => prev.filter(msg => msg._id !== tempId));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to send message.'
      });
    }
  };

  const handleFileUpload = (e) => {
      setSelectedFile(e.target.files[0]);
    };
  
    const handleClearMessage = () => {
      setNewMessage('');
      setSelectedFile(null);
    };
  
    // Client-side filtering using useMemo.
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Search term filtering
      if (
        searchTerm &&
        !request.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.email.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Department filtering
      if (filters.department && request.department !== filters.department) {
        return false;
      }

      // Status filtering
      if (filters.status && request.status !== filters.status) {
        return false;
      }

      // Ticket type filtering
      if (filters.ticketType && request.ticketType !== filters.ticketType) {
        return false;
      }

      // Role filtering
      if (
        filters.role &&
        request.user &&
        request.user.role !== filters.role
      ) {
        return false;
      }

      // Message status filtering
      if (filters.messageStatus === 'unreplied' && request.replied) {
        return false;
      }
      if (filters.messageStatus === 'replied' && !request.replied) {
        return false;
      }
      
      // New message read/unread filtering
      if (filters.messageStatus === 'unread' && (!unreadCounts[request._id] || unreadCounts[request._id] === 0)) {
        return false;
      }
      if (filters.messageStatus === 'read' && unreadCounts[request._id] && unreadCounts[request._id] > 0) {
        return false;
      }

      return true;
    });
  }, [requests, searchTerm, filters, unreadCounts]);

  // Get current page's requests for pagination
  const indexOfLastRequest = currentPage * itemsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  return (
    <div className="m-6 p-4 border border-gray-300 rounded-3xl shadow-2xl bg-white">
      {/* Search and Filter UI */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              className="w-full px-3 py-2 placeholder-blue-900 text-sm border rounded bg-gray-200"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-200 text-blue-900 rounded flex items-center gap-2 hover:bg-gray-300"
          >
            <FontAwesomeIcon icon={faFilter} />
            Filters
            {Object.values(filters).some(value => value !== '') && (
              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {Object.values(filters).filter(value => value !== '').length}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sorting}
              onChange={handleSortingChange}
              className="px-4 py-2 text-blue-600 text-sm border rounded bg-gray-200"
            >
              <option value="">Sort By</option>
              <option value="new-to-old">New to Old</option>
              <option value="old-to-new">Old to New</option>
              <option value="status">Status</option>
              <option value="request-type-ascending">Request Type (A-Z)</option>
              <option value="request-type-descending">Request Type (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">All Departments</option>
                {data.department.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type</label>
              <select
                name="ticketType"
                value={filters.ticketType}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">All Ticket Types</option>
                {data.ticketType.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">All Roles</option>
                {data.role.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">All Statuses</option>
                {data.status.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Status</label>
              <select
                name="messageStatus"
                value={filters.messageStatus}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">All Messages</option>
                <option value="unread">Unread Messages</option>
                <option value="read">Read Messages</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setFilters({
                  priority: '',
                  department: '',
                  ticketType: '',
                  role: '',
                  status: '',
                  messageStatus: ''
                });
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Requests Management Table */}
      <div className="flex justify-center bg-slate-50 text-black">
        {loading ? (
          <div className="flex justify-center py-12">
            <ClipLoader color="#1e293b" loading={loading} size={50} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                  <table className="w-full table-fixed text-sm text-left text-gray-700">
                    <thead className="text-sm uppercase bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white">
                <tr>
                  <th className="px-6 py-5 font-bold tracking-wider text-center border-r border-blue-300 w-16">S.No</th>
                  <th className="px-4 py-5 font-bold tracking-wider border-r border-blue-300 w-32">Affiliation</th>
                  <th className="px-4 py-5 font-bold tracking-wider border-r border-blue-300 w-48">Request ID</th>
                  <th className="px-4 py-5 font-bold tracking-wider border-r border-blue-300 w-36">Submission Date</th>
                  <th className="px-4 py-5 font-bold tracking-wider text-center border-r border-blue-300 w-24">Details</th>
                  <th className="px-4 py-5 font-bold tracking-wider text-center border-r border-blue-300 w-32">Status</th>
                  <th className="px-4 py-5 font-bold tracking-wider text-center w-24">Chat</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((request, index) => {
                  const rowClass = unreadCounts[request._id] > 0 
                    ? "bg-amber-50 border-b border-slate-200 hover:bg-amber-100 transition-colors duration-200" 
                    : "bg-white border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200";
                  
                  return (
                    <tr key={request._id} className={rowClass}>
                      <td className="px-6 py-5 text-sm text-center font-bold text-slate-900 border-r border-slate-100 w-16">{request.serialNumber}</td>
                      <td className="px-4 py-5 text-sm border-r border-slate-100 w-32">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          request.role === 'Student' ? 'bg-blue-100 text-blue-800' :
                          request.role === 'Faculty' ? 'bg-purple-100 text-purple-800' :
                          request.role === 'Industry Partner' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.role}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-sm font-mono font-medium text-slate-900 border-r border-slate-100 w-48 truncate">{request.ticketID}</td>
                      <td className="px-4 py-5 text-sm text-slate-700 border-r border-slate-100 font-medium w-36">
                        {new Date(request.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      
                      <td className="px-4 py-5 text-center border-r border-slate-100">
                        <button 
                          className="bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105" 
                          onClick={async () => {
                            // Save current location with all search parameters
                            const currentPath = location.pathname + location.search;
                            
                            // Mark messages as read before navigating
                            if (unreadCounts[request._id] && unreadCounts[request._id] > 0) {
                              try {
                                await fetch(`${GlobalConfig.nodeUrl}/ticket/markMessagesAsRead/${request._id}?role=admin`, {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                                    'Content-Type': 'application/json'
                                  }
                                });
                                // Update unread counts locally
                                setUnreadCounts(prev => ({ ...prev, [request._id]: 0 }));
                              } catch (error) {
                                console.error('Error marking messages as read:', error);
                              }
                            }
                            
                            // Navigate to ticket details with the return path
                            navigate(`/ticketDetailsChat/${request._id}`, {
                              state: { returnTo: currentPath }
                            });
                          }}
                          title="View Details"
                        >
                          <FontAwesomeIcon icon={faEye} size="sm" />
                        </button>
                      </td>
                      <td className="px-4 py-5 text-center border-r border-slate-100 w-32">
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusChange(request._id, e.target.value)}
                          className={`border-2 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all duration-200 cursor-pointer ${
                            request.status === 'Open'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : request.status === 'In Progress'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                              : request.status === 'Ready'
                              ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                              : request.status === 'Shipped'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200'
                              : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {data.status.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-5 text-center w-24">
                        <button
                          onClick={() => openChatModal(request)}
                          className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Open Chat"
                        >
                          <FaRegCommentDots size={16} />
                          {unreadCounts[request._id] > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg animate-pulse">
                              {unreadCounts[request._id] > 9 ? '9+' : unreadCounts[request._id]}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        {totalPages > 0 && (
          <ul className="flex">
            {Array.from({ length: totalPages }, (_, i) => (
              <li
                key={i}
                className={`px-3 py-1 cursor-pointer ${currentPage === i + 1 ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CHAT MODAL for admin */}
      <Modal
        isOpen={chatModalOpen}
        onRequestClose={() => setChatModalOpen(false)}
        contentLabel="Chat Modal"
        className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center"
      >
        <div className="bg-white rounded-lg w-4/5 flex flex-col" style={{ maxHeight: '80vh' }}>
          {/* Header - now sticky */}
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10 rounded-t-lg">
            <h2 className="text-xl font-bold">Chat with Client</h2>
            <button onClick={() => setChatModalOpen(false)} className="text-red-500 text-2xl">
              <FaTimes />
            </button>
          </div>
          {/* Chat Messages - scrollable area */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-4">
              {loading ? (
                <ClipLoader color="#080f9c" loading={loading} size={50} />
              ) : (
                chatMessages.map((comment, idx) => (
                  <div key={idx} className={`flex ${comment.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start space-x-2">
                      {comment.from === 'admin' && <FaUserShield size={18} className="text-green-500 mt-1" />}
                      {comment.from === 'user' && <FaUser size={18} className="text-blue-500 mt-1" />}
                      {comment.from === 'system' && <FaRobot size={18} className="text-gray-500 mt-1" />}
                      <div
                        className={`rounded-lg p-2 max-w-[70%] ${
                          comment.from === 'admin'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{comment.message}</p>
                        {comment.attachment && (
                          <a
                            href={comment.attachment}
                            download
                            className={`text-xs underline ${
                              comment.from === 'admin' ? 'text-white' : 'text-gray-800'
                            }`}
                          >
                            Download Attachment
                          </a>
                        )}
                        <div className="text-right text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
          {/* Chat Input Area - sticky bottom */}
          <div className="flex p-4 items-center bg-white border-t sticky bottom-0 rounded-b-lg">
            <textarea
              className="flex-1 border rounded-md p-2 resize-none bg-white"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            ></textarea>
            <div className="flex items-center ">
              <label className="cursor-pointer flex items-center">
                <FaPaperclip className="text-gray-600 mr-1" size={20} />
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
              <button onClick={sendMessage} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md">
                {loading ? 'Sending...' : 'Send'}
              </button>
              <button onClick={handleClearMessage} className="ml-2 bg-gray-500 text-white px-3 py-1 rounded">
                Clear
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AllRequests;
