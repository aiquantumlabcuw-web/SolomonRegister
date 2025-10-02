import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader';
import GlobalConfig from '../../../config/GlobalConfig';
import Swal from 'sweetalert2';
import AdminFilePreview from '../components/AdminStlPreview';
import data from './../assets/data.json';
import DOMPurify from 'dompurify';

const TicketDetailsChat = () => {
  // Ticket details state and refs for editable fields
  const [currentTicket, setCurrentTicket] = useState({});
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false); // Track navigation state
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Refs for editing ticket details
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const departmentRef = useRef(null);
  const ticketTypeRef = useRef(null);
  const roleRef = useRef(null);
  const subjectRef = useRef(null);
  const detailsRef = useRef(null);

  // Ref for auto-scrolling chat area
  const messagesEndRef = useRef(null);

  // Add nextTicketId state
  const [nextTicketId, setNextTicketId] = useState(null);
  const [processingNext, setProcessingNext] = useState(false);

  // Add state for tracking processed status
  const [isProcessed, setIsProcessed] = useState(false);

  // Add state for edit mode and unsaved changes
  const [editableFields, setEditableFields] = useState({
    email: false,
    phone: false,
    department: false,
    ticketType: false,
    role: false
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState({});

  // Function to auto-scroll chat area to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch ticket details
  const getTicket = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getTicketById?id=${ticketId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch ticket');
      const data = await response.json();
      // Sanitize details if needed
      data.details = DOMPurify.sanitize(data.details);
      setCurrentTicket(data);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch ticket details.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch chat messages for the ticket
  const getChatMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${ticketId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setChatMessages(data);
      // After setting messages, auto-scroll with a slight delay to ensure DOM update
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get the next ticket that needs attention
  const fetchNextUnprocessedTicket = async () => {
    try {
      setLoading(true);
      // Get all tickets ordered by creation date
      const response = await fetch(
        `${GlobalConfig.nodeUrl}/ticket/getAllTickets`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const allTickets = await response.json();

        if (allTickets && allTickets.length > 0) {
          // Sort tickets by creation date (oldest first)
          const sortedTickets = [...allTickets].sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
          );

          // If there's only one ticket (the current one), show "No more tickets"
          if (sortedTickets.length === 1) {
            setNextTicketId(null);
            return;
          }

          // Find the index of the current ticket
          const currentIndex = sortedTickets.findIndex(ticket => ticket._id === ticketId);

          // If current ticket is the last one, go back to the first ticket
          // Otherwise, go to the next ticket in the list
          const nextIndex = (currentIndex === sortedTickets.length - 1 || currentIndex === -1)
            ? 0
            : currentIndex + 1;

          setNextTicketId(sortedTickets[nextIndex]._id);
        } else {
          setNextTicketId(null);
        }
      } else {
        setNextTicketId(null);
      }
    } catch (error) {
      console.error('Error fetching next ticket:', error);
      setNextTicketId(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if ticket is already marked as processed in localStorage
  useEffect(() => {
    const processedTickets = JSON.parse(localStorage.getItem('processedTickets') || '[]');
    setIsProcessed(processedTickets.includes(ticketId));
  }, [ticketId]);

  // Function to mark ticket as processed - keep for compatibility but not used in UI
  const markAsProcessed = () => {
    const processedTickets = JSON.parse(localStorage.getItem('processedTickets') || '[]');

    if (!processedTickets.includes(ticketId)) {
      processedTickets.push(ticketId);
      localStorage.setItem('processedTickets', JSON.stringify(processedTickets));
      setIsProcessed(true);

      // Show confirmation
      Swal.fire({
        icon: 'success',
        title: 'Ticket Marked',
        text: 'This ticket has been marked as processed',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  // Function to unmark ticket as processed - keep for compatibility but not used in UI
  const unmarkAsProcessed = () => {
    const processedTickets = JSON.parse(localStorage.getItem('processedTickets') || '[]');
    const updatedTickets = processedTickets.filter(id => id !== ticketId);

    localStorage.setItem('processedTickets', JSON.stringify(updatedTickets));
    setIsProcessed(false);
  };

  // useEffect to load ticket details and chat on mount
  useEffect(() => {
    getTicket();
    getChatMessages();
    fetchNextUnprocessedTicket();
  }, [ticketId]);

  // Add useEffect for unsaved changes warning - remove the beforeunload event
  useEffect(() => {
    // Remove the beforeunload event listener since we're handling navigation ourselves
    return () => { };
  }, [hasUnsavedChanges]);

  // Modify handleFieldChange to track changes
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setCurrentTicket(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  // Add function to toggle edit mode for a field
  const toggleEditMode = (fieldName) => {
    if (!editableFields[fieldName]) {
      // Store original value when entering edit mode
      setOriginalValues(prev => ({
        ...prev,
        [fieldName]: currentTicket[fieldName]
      }));
    }
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Add function to save individual field changes
  const saveFieldChange = async (fieldName) => {
    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/updateTicket/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ [fieldName]: currentTicket[fieldName] }),
      });

      if (!response.ok) throw new Error('Failed to update field');

      setEditableFields(prev => ({
        ...prev,
        [fieldName]: false
      }));
      setHasUnsavedChanges(false);

      Swal.fire({
        icon: 'success',
        title: 'Saved',
        text: 'Field updated successfully.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating field:', error);
      // Revert to original value on error
      setCurrentTicket(prev => ({
        ...prev,
        [fieldName]: originalValues[fieldName]
      }));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update field.',
      });
    }
  };

  // Simplified save function - only shows success message
  const saveChanges = async () => {
    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/updateTicket/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(currentTicket),
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      setHasUnsavedChanges(false);
      setEditableFields({
        email: false,
        phone: false,
        department: false,
        ticketType: false,
        role: false
      });

      Swal.fire({
        icon: 'success',
        title: 'Changes saved successfully',
        timer: 1500,
        showConfirmButton: false
      });

      return true;
    } catch (error) {
      console.error('Error saving changes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save changes'
      });
      return false;
    }
  };

  // Simplified navigation handler - single confirmation dialog
  const handleBackNavigation = async () => {
    if (hasUnsavedChanges) {
      const result = await Swal.fire({
        title: 'Unsaved Changes',
        text: 'Do you want to save your changes before leaving?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Save & Leave',
        cancelButtonText: 'Leave without Saving'
      });

      if (result.isConfirmed) {
        const saved = await saveChanges();
        if (saved) {
          navigateAway();
        }
      } else {
        navigateAway();
      }
    } else {
      navigateAway();
    }
  };

  // Helper function for navigation - simplified
  const navigateAway = () => {
    const returnPath = location.state?.returnTo || '/allTickets';
    window.location.href = returnPath;
  };

  // Auto-save when status changes
  const handleStatusChange = async (value) => {
    // Update the local state first
    setCurrentTicket({ ...currentTicket, status: value });

    try {
      // Make API call to update just the status
      const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/updateStatus/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: value }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // No need for a success notification for status changes as it's expected to be automatic
    } catch (error) {
      console.error('Error updating ticket status:', error);
      // Show error notification if update fails
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update ticket status. Please try again.',
      });
    }
  };

  // Handle file selection for chat attachment
  const handleFileUpload = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Submit a new chat message - enhanced with optimistic UI updates
  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return; // Do not send empty messages

    // Create temporary message for optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const currentTime = new Date();
    const tempMessage = {
      _id: tempId,
      message: newMessage,
      from: 'admin',
      createdAt: currentTime,
      messageStatus: { admin: 'read', user: 'unread' }
    };

    // Update UI immediately with the new message
    setChatMessages(prev => [...prev, tempMessage]);

    // Store message content and clear input for better UX
    const messageToSend = newMessage;
    const fileToSend = selectedFile;
    setNewMessage('');
    setSelectedFile(null);

    // Scroll to bottom to show new message
    setTimeout(() => {
      scrollToBottom();
    }, 50);

    // Create form data for the API call
    const formData = new FormData();
    formData.append('ticketID', ticketId);
    formData.append('message', messageToSend);
    formData.append('from', 'admin');
    if (fileToSend) {
      formData.append('file', fileToSend);
    }

    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/submitcomment`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        }
      });
      const result = await response.json();

      if (response.ok) {
        // Fetch updated messages from the server
        const refreshResponse = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${ticketId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          }
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setChatMessages(data);
        }
      } else {
        console.error(result.message);
        // Remove temp message on error
        setChatMessages(prev => prev.filter(msg => msg._id !== tempId));
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message || 'Failed to send message.',
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setChatMessages(prev => prev.filter(msg => msg._id !== tempId));
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to send message.',
      });
    }
  };

  // For handling focus on editable fields via the edit icon
  const handleImageClick = (inputRef) => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle navigation to the next ticket
  const handleProcessNextTicket = async () => {
    if (!nextTicketId) return;

    try {
      setProcessingNext(true);

      // Automatically save the current ticket details first
      await saveChanges();

      // Update UI to give user feedback
      Swal.fire({
        title: 'Moving to next ticket...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        timer: 1000,
        timerProgressBar: true,
        showConfirmButton: false
      });

      // Then navigate to the next ticket
      setTimeout(() => {
        // Preserve the returnTo path if it exists
        const returnPath = location.state?.returnTo || '/allTickets';
        window.location.href = `/ticketDetailsChat/${nextTicketId}`;

        // Set the returnTo in sessionStorage since direct navigation won't pass location state
        sessionStorage.setItem('returnToPath', returnPath);
      }, 1000);
    } catch (error) {
      console.error('Error navigating to next ticket:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to navigate to next ticket.',
      });
      setProcessingNext(false);
    }
  };

  // Check for returnTo path in sessionStorage when component mounts
  useEffect(() => {
    const savedReturnPath = sessionStorage.getItem('returnToPath');
    if (savedReturnPath && !location.state?.returnTo) {
      // If we have a saved return path and no returnTo in location state,
      // update location state with the saved path
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, returnTo: savedReturnPath }
      });
      // Clear the saved path after using it
      sessionStorage.removeItem('returnToPath');
    }
  }, []);

  return (
    <div className="p-4 container mx-auto w-[75%]">
      {/* Back to Tickets Button - outside container but aligned */}
      <div className="w-full mx-auto mb-6">
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
          onClick={handleBackNavigation}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Requests
        </button>
      </div>

      {/* Main container */}
      <div className="bg-white border border-gray-300 rounded-3xl shadow-2xl p-4 md:p-6 ">
        {/* Ticket Details Section - adjusted grid for better spacing */}
        <div className='w-full mx-auto overflow-y-auto max-h-[80vh]'>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Subject - Now in the first row and full width */}
            <div className="col-span-2">
              <label className="block text-lg font-medium text-blue-700">Subject</label>
              <div className="flex">
                <input
                  type="text"
                  name="subject"
                  value={currentTicket.subject || ''}
                  className="mt-1 p-1 block w-full rounded-md shadow-md bg-gray-100"
                  readOnly
                />
              </div>
            </div>

            {/* Project Description/Details - Full width */}
            <div className="col-span-2">
              <label className="block text-lg font-medium text-blue-700">Project Description</label>
              <div className="mt-1 p-3 block w-full rounded-md shadow-md bg-gray-50 border border-gray-200 min-h-[120px]">
                {currentTicket.details ? (
                  <div 
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(currentTicket.details, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                        ALLOWED_ATTR: []
                      })
                    }}
                  />
                ) : (
                  <p className="text-gray-500 italic">No project description provided</p>
                )}
              </div>
            </div>

            {/* RequestID */}
            <div>
              <label className="block text-lg font-medium text-blue-700">Request ID</label>
              <div className="flex">
                <input
                  type="text"
                  name="ticketID"
                  value={currentTicket.ticketID || ''}
                  className="mt-1 p-1 block w-60 rounded-md shadow-md bg-gray-100"
                  readOnly
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-lg font-medium text-blue-700">Email</label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="email"
                  value={currentTicket.email || ''}
                  onChange={handleFieldChange}
                  className={`mt-1 p-1 block w-60 rounded-md shadow-md ${editableFields.email ? 'bg-white' : 'bg-gray-100'
                    }`}
                  readOnly={!editableFields.email}
                />
                <div className="flex ml-2">
                  {editableFields.email ? (
                    <>
                      <button onClick={() => saveFieldChange('email')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button onClick={() => toggleEditMode('email')} className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => toggleEditMode('email')}>
                      <img
                        className="w-10 cursor-pointer"
                        src="/public/edit_pen.png"
                        alt="Edit"
                      />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-lg font-medium text-blue-700">Phone</label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="phone"
                  value={currentTicket.phone || ''}
                  onChange={handleFieldChange}
                  className={`mt-1 p-1 block w-60 rounded-md shadow-md ${editableFields.phone ? 'bg-white' : 'bg-gray-100'
                    }`}
                  readOnly={!editableFields.phone}
                />
                <div className="flex ml-2">
                  {editableFields.phone ? (
                    <>
                      <button onClick={() => saveFieldChange('phone')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button onClick={() => toggleEditMode('phone')} className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => toggleEditMode('phone')}>
                      <img
                        className="w-10 cursor-pointer"
                        src="/public/edit_pen.png"
                        alt="Edit"
                      />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Department - Changed to dropdown */}
            <div>
              <label className="block text-lg font-medium text-blue-700">Department</label>
              <div className="flex items-center">
                <select
                  name="department"
                  value={currentTicket.department || ''}
                  onChange={handleFieldChange}
                  className={`mt-1 p-1 block w-60 rounded-md shadow-md ${editableFields.department ? 'bg-white' : 'bg-gray-100'
                    }`}
                  disabled={!editableFields.department}
                >
                  <option value="">Select Department</option>
                  {data.department.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="flex ml-2">
                  {editableFields.department ? (
                    <>
                      <button onClick={() => saveFieldChange('department')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button onClick={() => toggleEditMode('department')} className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => toggleEditMode('department')}>
                      <img
                        className="w-10 cursor-pointer"
                        src="/public/edit_pen.png"
                        alt="Edit"
                      />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Service Type - Changed to dropdown */}
            <div>
              <label className="block text-lg font-medium text-blue-700">Service Type</label>
              <div className="flex items-center">
                <select
                  name="ticketType"
                  value={currentTicket.ticketType || ''}
                  onChange={handleFieldChange}
                  className={`mt-1 p-1 block w-60 rounded-md shadow-md ${editableFields.ticketType ? 'bg-white' : 'bg-gray-100'
                    }`}
                  disabled={!editableFields.ticketType}
                >
                  <option value="">Select Ticket Type</option>
                  {data.ticketType.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="flex ml-2">
                  {editableFields.ticketType ? (
                    <>
                      <button onClick={() => saveFieldChange('ticketType')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button onClick={() => toggleEditMode('ticketType')} className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => toggleEditMode('ticketType')}>
                      <img
                        className="w-10 cursor-pointer"
                        src="/public/edit_pen.png"
                        alt="Edit"
                      />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Affiliation - Changed to dropdown */}
            <div>
              <label className="block text-lg font-medium text-blue-700">Affiliation</label>
              <div className="flex items-center">
                <select
                  name="role"
                  value={currentTicket.role || ''}
                  onChange={handleFieldChange}
                  className={`mt-1 p-1 block w-60 rounded-md shadow-md ${editableFields.role ? 'bg-white' : 'bg-gray-100'
                    }`}
                  disabled={!editableFields.role}
                >
                  <option value="">Select Role</option>
                  {data.role.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="flex ml-2">
                  {editableFields.role ? (
                    <>
                      <button onClick={() => saveFieldChange('role')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button onClick={() => toggleEditMode('role')} className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 border rounded-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => toggleEditMode('role')}>
                      <img
                        className="w-10 cursor-pointer"
                        src="/public/edit_pen.png"
                        alt="Edit"
                      />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Status - Now in the last row and full width */}
            <div className="col-span-2">
              <label className="block mb-2 text-lg font-medium text-blue-700">Status</label>
              <select
                value={currentTicket.status || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`border rounded w-32 px-2 py-1 ${currentTicket.status === 'Open'
                  ? 'text-green-500'
                  : currentTicket.status === 'In Progress'
                    ? 'text-yellow-500'
                    : currentTicket.status === 'Ready'
                      ? 'text-blue-500'
                      : currentTicket.status === 'Shipped'
                        ? 'text-indigo-500'
                        : 'text-gray-500'
                  }`}
              >
                {data.status.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference Links Section */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-blue-700 mb-3">Reference Links</label>
            {currentTicket.cloudLink && currentTicket.cloudLink.length > 0 ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
                {currentTicket.cloudLink.map((link, index) => (
                  <div key={index} className="flex items-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.828 21H5.172a2 2 0 01-1.414-3.414l8.656-8.656m7.071 0L10.343 4.586a2 2 0 00-2.828 0l-2.828 2.828a2 2 0 000 2.828l8.657 8.656A2 2 0 0021 18.828V10.172a2 2 0 00-2.829-1.414z"
                      />
                    </svg>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex-grow truncate text-sm"
                      title={link}
                    >
                      {link.length > 60 ? `${link.substring(0, 60)}...` : link}
                    </a>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Link {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-500 italic">No reference links provided</p>
              </div>
            )}
          </div>

          {/* Supporting Documents Section */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-blue-700 mb-3">Supporting Documents</label>
            {currentTicket.attachments && currentTicket.attachments.length > 0 ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-3">
                {currentTicket.attachments.map((attachment, index) => {
                  const modifiedAttachment = attachment.split('\\').pop();
                  const displayAttachment = attachment.split('-').pop();
                  const fileUrl = `${GlobalConfig.nodeUrl}/ticket/download?filePath=${encodeURIComponent(
                    attachment
                  )}`;
                  const fileExtension = displayAttachment.split('.').pop()?.toLowerCase();
                  
                  return (
                    <div key={index} className="flex items-center p-3 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 mr-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          ['pdf'].includes(fileExtension) ? 'bg-red-100 text-red-600' :
                          ['doc', 'docx'].includes(fileExtension) ? 'bg-blue-100 text-blue-600' :
                          ['xls', 'xlsx'].includes(fileExtension) ? 'bg-green-100 text-green-600' :
                          ['ppt', 'pptx'].includes(fileExtension) ? 'bg-orange-100 text-orange-600' :
                          ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension) ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate" title={displayAttachment}>
                          {displayAttachment}
                        </p>
                        <p className="text-xs text-gray-500 uppercase">
                          {fileExtension} file
                        </p>
                      </div>
                      <a
                        href={fileUrl}
                        download
                        rel="noopener noreferrer"
                        className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download
                      </a>
                      {/* 3D Model Preview for supported files */}
                      {(modifiedAttachment.endsWith('.3mf') ||
                        modifiedAttachment.endsWith('.stl') ||
                        modifiedAttachment.endsWith('.obj')) && (
                        <div className="mt-2 w-full">
                          <AdminFilePreview file={fileUrl} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-500 italic">No supporting documents provided</p>
              </div>
            )}
          </div>

          <hr className="my-6" />

          {/* Chat Section */}
          <h2 className="text-xl font-bold mb-4 sticky top-0 bg-white z-10">Chat with Client</h2>
          <div className="flex flex-col border rounded-lg overflow-hidden" style={{ maxHeight: '50vh' }}>
            {/* Chat Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {loading && chatMessages.length === 0 ? (
                <div className="flex justify-center">
                  <ClipLoader color="#080f9c" loading={loading} size={50} />
                </div>
              ) : (
                chatMessages.map((comment, key) => (
                  <div
                    key={key}
                    className={`mb-2 flex ${comment.from === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`p-2 rounded-lg max-w-[70%] ${comment.from === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                    >
                      <p className="text-sm">{comment.message}</p>
                      {comment.attachment && (
                        <a
                          href={comment.attachment}
                          download
                          className={`text-xs underline ${comment.from === 'admin' ? 'text-white' : 'text-gray-800'
                            }`}
                        >
                          Download Attachment
                        </a>
                      )}
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Chat Input Area */}
            <div className="p-4 bg-white border-t sticky bottom-0">
              <div className="flex items-center">
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
                <label className="cursor-pointer flex items-center ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <div className="ml-2 text-sm text-gray-600 flex items-center">
                    <span className="truncate max-w-[100px]">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="ml-1 text-red-500"
                    >
                      ×
                    </button>
                  </div>
                )}
                <button onClick={sendMessage} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation Footer - modified to have only one save button */}
        <div>
          <div className=" flex justify-end items-center border-t pt-6">
            <div className="flex ">
              {/* Single Save Changes button */}
              <button
                onClick={handleBackNavigation}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mr-3"
              >
                Save Changes
              </button>

              {/* Process Next Ticket button - only show if there's a next ticket */}
              {nextTicketId && (
                <button
                  onClick={handleProcessNextTicket}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
                  disabled={processingNext}
                >
                  {processingNext ? 'Processing...' : 'Process Next Ticket'}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {/* Show a message if no more tickets to process */}
              {!nextTicketId && !loading && (
                <span className="text-gray-500 italic flex items-center ml-3">
                  No more tickets to process
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsChat;
