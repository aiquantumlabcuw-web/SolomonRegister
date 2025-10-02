import React, { useState, useEffect } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import data from './../assets/data.json'; 
import Modal from 'react-modal';
import { submitComment } from '../buttonActions/submitAdminComment';
import Swal from 'sweetalert2';
import GlobalConfig from '../../../config/GlobalConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEye, faTrash, faComment, faTimes, faSort, faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FaRegCommentDots } from 'react-icons/fa';
import { FaTimes, FaPaperclip, FaUser, FaUserShield, FaRobot } from 'react-icons/fa';


const MyRequests = () => {
  const token = sessionStorage.getItem('token');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [chatModalIsOpen, setChatModalIsOpen] = useState(false);
  const [fetchComment, setFetchComment] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState({});
  const [filters, setFilters] = useState({
      priority: '',
      department: '',
      ticketType: '',
      identity: '',
      status: ''
  });
  const [sorting, setSorting] = useState(' ');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [preferences, setPreferences] = useState({
      ticketType: '',
      sorting: '',
  });
  // NEW: State to hold unread message counts per ticket (only counts messages where messageStatus.user === 'unread')
  const [unreadCounts, setUnreadCounts] = useState({});

  const itemsPerPage = 5;

  // Function to get color based on ticket status (unchanged)
  const getStatusColor = (status) => {
      return status === 'Open' ? 'text-green-500' :
             status === 'In Progress' ? 'text-yellow-500' :
             status === 'Ready' ? 'text-blue-500' :
             status === 'Shipped' ? 'text-indigo-500' :
             'text-gray-500';
  };

  // Open view modal - now also updates the row highlight but keeps the unread message count
  const openModal = (ticket) => {
      setCurrentTicket(ticket);
      setModalIsOpen(true);
      
      // Create a new copy of the requests array with the highlight removed for this request
      setRequests(prevRequests => 
        prevRequests.map(r => 
          r._id === ticket._id 
            ? { ...r, highlightRemoved: true } // Add a flag to indicate highlight was removed
            : r
        )
      );
  };

  const closeModal = () => {
      setModalIsOpen(false);
  };

  const handleFileUpload = (e) => {
      setSelectedFile(e.target.files[0]);
  };

  // UPDATED: sendMessage now uses optimistic UI updates for better UX
  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Message cannot be empty.' });
      return;
    }
    
    // Create a temporary message for optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const currentTime = new Date();
    const tempMessage = {
      _id: tempId,
      message: newMessage,
      from: 'user',
      createdAt: currentTime,
      messageStatus: { admin: 'unread', user: 'read' }
    };
    
    // Update UI immediately with the new message
    setFetchComment(prev => [...prev, tempMessage]);
    
    // Store message content and clear input for better UX
    const messageToSend = newMessage;
    const fileToSend = selectedFile;
    setNewMessage('');
    setSelectedFile(null);
  
    const formData = new FormData();
    formData.append('ticketID', currentTicket._id);
    formData.append('message', messageToSend);
    formData.append('from', 'user');
    if (fileToSend) {
      formData.append('file', fileToSend);
    }
  
    try {
      const response = await submitComment(formData);
  
      // Safely parse JSON in case there's no JSON body or it's 201 Created
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        // If parsing fails, just default to an empty object
        result = {};
      }
  
      // Check for success via status code
      if (response.ok || response.status === 201) {
        // Refresh chat messages silently in the background
        const refreshResponse = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${currentTicket._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          }
        });
        
        if (refreshResponse.ok) {
          const refreshedComments = await refreshResponse.json();
          setFetchComment(refreshedComments);
        }
      } else {
        // Remove the temp message if there was an error
        setFetchComment(prev => prev.filter(msg => msg._id !== tempId));
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message || 'Unable to send message.'
        });
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      
      // Remove the temp message if there was an error
      setFetchComment(prev => prev.filter(msg => msg._id !== tempId));
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Unable to send message.'
      });
    }
  };
  

  useEffect(() => {
      const savedPreferences = localStorage.getItem('ticketPreferences');
      if (savedPreferences) {
          const parsedPreferences = JSON.parse(savedPreferences);
          setPreferences(parsedPreferences);
          if (parsedPreferences.ticketType) {
              setFilters((prev) => ({ ...prev, ticketType: parsedPreferences.ticketType }));
          }
          if (parsedPreferences.sorting) {
              setSorting(parsedPreferences.sorting);
          }
      }
  }, []);

  useEffect(() => {
      const fetchRequests = async () => {
          try {
              const queryParams = new URLSearchParams({
                  searchTerm,
                  ...filters,
              }).toString();

              const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getMyTickets?${queryParams}`, {
                  method: 'GET',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                  }
              });

              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }

              const data = await response.json();
              const reversedData = data.reverse();
             
              setRequests(reversedData);

              // NEW: For each request, fetch unread count (only count messages where messageStatus.user === 'unread')
              const counts = {};
              for (const request of reversedData) {
                  try {
                      const res = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${request._id}`, {
                          method: 'GET',
                          headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                          }
                      });
                      if (res.ok) {
                          const comments = await res.json();
                          const count = comments.filter(c => c.messageStatus && c.messageStatus.user === 'unread').length;
                          counts[request._id] = count;
                      } else {
                          counts[request._id] = 0;
                      }
                  } catch (err) {
                      counts[request._id] = 0;
                  }
              }
              setUnreadCounts(counts);
          } catch (error) {
              console.error(error);
          } finally {
              setLoading(false);
          }
      };

      fetchRequests();
  }, [searchTerm, filters, token]);

  const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
  };

  const savePreferences = (key, value) => {
      const updatedPreferences = { ...preferences, [key]: value };
      setPreferences(updatedPreferences);
      localStorage.setItem('ticketPreferences', JSON.stringify(updatedPreferences));
  };

  const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
      if (name === 'ticketType') {
          savePreferences('ticketType', value);
      }
      setCurrentPage(1);
  };

  const statusPriority = {
      "Open": 1,
      "In Progress": 2,
      "Ready": 3,
      "Shipped": 4,
      "Closed": 5,
  };

  const sortedRequests = [...requests].sort((a, b) => {
    if (sorting === 'new-to-old') {
        const dateA = a.lastChangedAt ? new Date(a.lastChangedAt) : new Date(a.createdAt);
        const dateB = b.lastChangedAt ? new Date(b.lastChangedAt) : new Date(b.createdAt);
        return dateB - dateA;
    }
    if (sorting === 'old-to-new') {
        return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sorting === 'status'){
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
    }
    if (sorting === 'request-type-ascending'){
        return a.ticketType.localeCompare(b.ticketType);
    }
    if (sorting === 'request-type-descending'){
        return b.ticketType.localeCompare(a.ticketType);
    }
    return 0;
});


  const handleSortingChange = (e) => {
      const value = e.target.value;
      setSorting(value);
      savePreferences('sorting', value);
  };

  const handleStatusChange = (e) => {
      setFilters({
          ...filters,
          status: e.target.value
      });
      setCurrentPage(1);
  };

  const handlePageChange = (page) => {
      setCurrentPage(page);
  };

  const handleDelete = async (ticketId) => {
      Swal.fire({
          title: 'Are you sure?',
          text: 'You will not be able to recover this request!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, delete it!',
          cancelButtonText: 'No, keep it',
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6'
      }).then(async (result) => {
          if (result.isConfirmed) {
              try {
                  const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/deleteTicket/${ticketId}`, {
                      method: 'DELETE',
                      headers: {
                          'Authorization': `Bearer ${token}`
                      }
                  });
  
                  if (!response.ok) {
                      throw new Error('Failed to delete request');
                  }
  
                  Swal.fire({
                      icon: 'success',
                      title: 'Success',
                      text: 'Request deleted successfully',
                      showConfirmButton: false,
                      timer: 2500,
                      timerProgressBar: true
                  });
  
                  setRequests(requests.filter(request => request._id !== ticketId));
              } catch (error) {
                  console.error(error);
                  Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'Failed to delete request',
                  });
              }
          }
      });
  };

  const getComment = async (request) => {
      setLoading(true);
      try {
          const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${request._id}`, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
              }
          });
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setFetchComment(data);
      } catch (error) {
          console.log(error);
      } finally {
          setLoading(false);
      }
  };

  const chatCloseModal = () => {
      setChatModalIsOpen(false);
  };

  // When opening chat modal, refresh chat and (ideally) mark messages as read
  const chatOpenModal = async (request) => {
    setCurrentTicket(request);
    await getComment(request);  // Refresh the chat messages
    try {
      const res = await fetch(
        `${GlobalConfig.nodeUrl}/ticket/markMessagesAsRead/${request._id}?role=user`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (res.ok) {
        // Update the unread count for this request to zero
        setUnreadCounts(prev => ({ ...prev, [request._id]: 0 }));
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
    setChatModalIsOpen(true);
  };
  

  const filteredRequests = sortedRequests
    .filter(request => {
        const matchesStatus = filters.status ? request.status === filters.status : true;
        const matchesSearch = searchTerm
            ? request.ticketType.toLowerCase().includes(searchTerm.toLowerCase()) ||
              request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
              request.ticketID.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        return matchesStatus && matchesSearch;
    })
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(requests.length / itemsPerPage);

  return (
    <div className="min-h-screen justify-center px-4 py-10 rounded backgroundImage3dPrinter">
      <div className="min-h-[75%] mx-auto w-[80%] p-8 rounded-lg shadow-lg bg-white">
        <div className="flex mb-4">
            <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
                className="px-4 py-2 border rounded mr-4"
            />
            <select
                name="ticketType"
                value={filters.ticketType}
                onChange={handleFilterChange}
                className="px-4 py-2 border rounded mr-4"
            >
                <option value="">All Request Types</option>
                {data.ticketType.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
            <div className="relative">
                <select
                    value={sorting}
                    onChange={handleSortingChange}
                    className="pl-10 pr-4 py-2 border rounded mr-4 appearance-none w-full"
                >
                    <option value=" ">Sort by</option>
                    <option value="new-to-old">New to Old</option>
                    <option value="old-to-new">Old to New</option>
                    <option value="status">Status</option>
                    <option value="request-type-ascending">Request Type (A-Z)</option>
                    <option value="request-type-descending">Request Type (Z-A)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FontAwesomeIcon icon={faSort} className="text-gray-500" />
                </div>
            </div>
        </div>
        <div className="relative overflow-x-auto">
            {loading ? (
                <ClipLoader color={'#000000'} loading={loading} size={150} />
            ) : (
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                  <table className="w-full table-fixed text-sm text-left text-gray-700">
                    <thead className="text-sm uppercase bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white">
                        <tr>
                            <th className="w-1/5 py-5 px-4 font-bold tracking-wider border-r border-slate-500">Request ID</th>
                            <th className="w-1/5 py-5 px-4 font-bold tracking-wider border-r border-slate-500">Service Type</th>
                            <th className="w-1/5 py-5 px-4 font-bold tracking-wider border-r border-slate-500">Submission Date</th>
                            <th className="w-1/5 py-5 px-4 font-bold tracking-wider border-r border-slate-500">Status</th>
                            <th className="w-1/5 py-5 px-4 font-bold tracking-wider border-r border-slate-500">Actions</th>
                            <th className="w-1/5 py-5 px-4 font-bold tracking-wider">Chat</th>
                        </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.length < 1 ? (
                        <tr>
                          <td colSpan={6}><p className="mx-auto">No requests created yet</p></td>
                        </tr>
                      ) : null}
                        {filteredRequests.map(request => (
                              <tr
                              key={request._id}
                              className={unreadCounts[request._id] > 0 && !request.highlightRemoved ? "bg-amber-50 border-b border-slate-200 hover:bg-amber-100 transition-colors duration-200" : "bg-white border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200"}
                            >
                                <td className="w-1/5 py-5 px-4 font-mono font-bold text-slate-900 border-r border-slate-100">{request.ticketID}</td>
                                <td className="w-1/5 py-5 px-4 text-slate-800 border-r border-slate-100">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                    request.ticketType === 'Resources Request (Solomon)' ? 'bg-blue-100 text-blue-800' :
                                    request.ticketType === 'Collaboration Requests' ? 'bg-purple-100 text-purple-800' :
                                    request.ticketType === 'Consulting' ? 'bg-emerald-100 text-emerald-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {request.ticketType}
                                  </span>
                                </td>
                                <td className="w-1/5 py-5 px-4 text-slate-700 font-medium border-r border-slate-100">
                                  {new Date(request.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </td>
                                <td className="w-1/5 py-5 px-4 border-r border-slate-100">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                    request.status === 'Open' ? 'bg-emerald-100 text-emerald-800' :
                                    request.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                                    request.status === 'Ready' ? 'bg-blue-100 text-blue-800' :
                                    request.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {request.status}
                                  </span>
                                </td>
                                <td className="w-1/5 py-5 px-4 border-r border-slate-100">
                                    <button 
                                      onClick={() => openModal(request)} 
                                      className="bg-slate-700 hover:bg-slate-800 text-white p-3 rounded-lg mr-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                      title="View Details"
                                    >
                                      <FontAwesomeIcon icon={faEye} size="sm" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(request._id)}
                                        disabled={request.status === "shipped" || request.status === "closed"}
                                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed transform hover:scale-105"
                                        title="Delete"
                                    >
                                        <FontAwesomeIcon icon={faTrash} size="sm" />
                                    </button>
                                </td>
                                <td className="w-1/5 py-5 px-4 text-center">
                                    <button 
                                      className="relative bg-slate-600 hover:bg-slate-700 text-white p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105" 
                                      onClick={() => chatOpenModal(request)}
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
                        ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>
        <div className="flex justify-between mt-4">
            <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded"
            >
                Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded"
            >
                Next
            </button>
        </div>
      </div>

      {/* VIEW TICKET MODAL (original styling) */}
      <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Request Details"
          className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center"
      >
          {currentTicket && (
              <div className="fixed top-30 left-1/2 transform -translate-x-1/2 bg-white rounded-lg p-6 w-3/4 shadow-xl border border-gray-200"
              style={{ zIndex: 100, maxHeight: "90vh", overflowY: "auto" }}>
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Request Details</h2>
                      <button 
                        onClick={closeModal} 
                        className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Close"
                      >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                      </button>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                          <label className="block text-sm font-semibold text-gray-700">Subject</label>
                          <div className="bg-gray-50 border rounded-lg p-2 text-gray-800">
                              {currentTicket.subject}
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700">Email</label>
                          <div className="bg-gray-50 border rounded-lg p-2 text-gray-800">
                              {currentTicket.email}
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700">Phone</label>
                          <div className="bg-gray-50 border rounded-lg p-2 text-gray-800">
                              {currentTicket.phone}
                          </div>
                      </div>
                      {currentTicket.role === "Faculty" && (
                          <div>
                              <label className="block text-sm font-semibold text-gray-700">Department</label>
                              <div className="bg-gray-50 border rounded-lg p-2 text-gray-800">
                                  {currentTicket.department}
                              </div>
                          </div>
                      )}
                      <div>
                          <label className="block text-sm font-semibold text-gray-700">Service Type</label>
                          <div className="bg-gray-50 border rounded-lg p-2 text-gray-800">
                              {currentTicket.ticketType}
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700">Affiliation</label>
                          <div className="bg-gray-50 border rounded-lg p-2 text-gray-800">
                              {currentTicket.role}
                          </div>
                      </div>
                  </div>
                  <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">URL Attached</label>
                      <ul className="list-disc list-inside bg-gray-50 border rounded-lg p-4 space-y-2">
                          {currentTicket.cloudLink && currentTicket.cloudLink.length > 0 ? (
                              currentTicket.cloudLink.map((link, index) => (
                                  <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2 text-blue-500">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 21H5.172a2 2 0 01-1.414-3.414l8.656-8.656m7.071 0L10.343 4.586a2 2 0 00-2.828 0l-2.828 2.828a2 2 0 000 2.828l8.657 8.656A2 2 0 0021 18.828V10.172a2 2 0 00-2.829-1.414z" />
                                      </svg>
                                      {`Link ${index + 1}`}
                                  </a>
                              ))
                          ) : (
                              <p>No Links Attached</p>
                          )}
                      </ul>
                  </div>
                  {currentTicket.attachments && currentTicket.attachments.length > 0 && (
                      <div className="mb-6">
                          <label className="block text-sm mt-2 mb-1 font-semibold text-gray-700">Attachments</label>
                          <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                              {currentTicket.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-white shadow rounded-md">
                                      <span className="text-gray-600">Attachment {index + 1}</span>
                                      <a href={`${GlobalConfig.nodeUrl}/ticket/download?filePath=${encodeURIComponent(attachment)}`} download className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded transition-colors" target="_blank" rel="noopener noreferrer">
                                          Download
                                      </a>
                                  </div>
                              ))}
                          </div>
                          <div className="mb-6">
                              <label className="block text-sm mt-2 mb-2 font-semibold text-gray-700">Details</label>
                              <div className="bg-gray-50 border rounded-lg p-4 text-gray-800" dangerouslySetInnerHTML={{ __html: currentTicket.details }}></div>
                          </div>
                      </div>
                  )}
              </div>
          )}
      </Modal>
      <Modal
  isOpen={chatModalIsOpen}
  onRequestClose={chatCloseModal}
  contentLabel="Chat Modal"
  className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center"
>
  {/* Outer container with fixed height, flex column layout */}
  <div
    className="bg-white rounded-lg w-3/4 p-6"
    style={{
      height: '70vh',          // entire modal is 70vh
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Chat with Support</h2>
      <button onClick={chatCloseModal} className="text-red-500 text-2xl">
        <FaTimes />
      </button>
    </div>

    {/* Scrollable messages container with flex: 1 */}
    <div className="flex-1 overflow-y-auto space-y-4">
      {loading ? (
        <ClipLoader color="#080f9c" loading={loading} size={50} />
      ) : (
        fetchComment.map((comment, idx) => {
          // Set styling based on sender
          const messageClass =
            comment.from === 'user'
              ? 'bg-blue-500 text-white'
              : comment.from === 'admin'
              ? 'bg-gray-200 text-gray-800'
              : comment.from === 'system'
              ? 'bg-purple-200 text-purple-800'
              : 'bg-gray-200 text-gray-800';
          
          return (
            <div key={idx} className={`flex ${comment.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex items-start space-x-4">
                {comment.from === 'user' && <FaUser size={20} className="text-blue-500 mt-1" />}
                {comment.from === 'admin' && <FaUserShield size={20} className="text-green-500 mt-1" />}
                {comment.from === 'system' && <FaRobot size={20} className="text-purple-800 mt-1" />}
                <div className={`rounded-lg p-2 max-w-[70%] ${messageClass}`}>
                  <p className="text-sm">{comment.message}</p>
                  {comment.attachment && (
                    <a
                      href={comment.attachment}
                      download
                      className={`text-xs underline ${comment.from === 'user' ? 'text-white' : 'text-gray-800'}`}
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
          );
        })
      )}
    </div>

    {/* Input area pinned at the bottom */}
    <div className="mt-4 flex items-center">
      <textarea
        className="flex-1 border rounded-md p-2 resize-none"
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

      {/* Attachment icon */}
      <label className="cursor-pointer flex items-center ml-2">
        <FaPaperclip className="text-gray-600 mr-1" size={20} />
        <input
          type="file"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {/* Send button */}
      <button
        onClick={sendMessage}
        className="ml-2 bg-blue-500 text-white px-3 py-1 rounded-md"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  </div>
</Modal>


    </div>
  );
};

export default MyRequests;