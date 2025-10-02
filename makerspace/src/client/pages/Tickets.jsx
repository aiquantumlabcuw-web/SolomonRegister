import isURL from "validator/lib/isURL";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import dropdownData from "./../assets/data.json";
import { submitTicket } from "../buttonActions/submitTicket";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import Attachments from "../components/Attachments";
import { useRecoilValue } from "recoil";
import { fileType } from "../store/atoms/isLoggedIn";
import { FaCheck, FaTrash } from 'react-icons/fa';



const Tickets = () => {


  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(null);
  const [department, setDepartment] = useState('Choose');
  const [ticketType, setTicketType] = useState('Choose');
  const [role, setRole] = useState('Choose');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState([]);
  const warningStl = useRecoilValue(fileType);
  const [showDepartment, setShowDepartment] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
const [showLinks, setShowLinks] = useState(false);
  const [errors, setErrors] = useState({});
  const [useCloudLink, setUseCloudLink] = useState(false); // Toggle between Cloud Link and Attachment
  const [attachFileAfterLink, setAttachFileAfterLink] = useState(false); // Checkbox for additional attachment after link
  const [cloudLinks, setCloudLinks] = useState([]); // Store multiple links
const [currentLink, setCurrentLink] = useState(''); // Store the current input link
const [linkError, setLinkError] = useState(null); // Error for invalid links
const [testTicket, setTestTicket] = useState(false);
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  

  const validatePhoneNumber = (phoneNumber) => phoneRegex.test(phoneNumber);

  const handlePhone = (e) => {
    const { value } = e.target;
    setPhone(value);
    setIsValidPhone(validatePhoneNumber(value));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
  };

  const handleDepartment = (e) => setDepartment(e.target.value);

  const handleTicketType = (e) => {
    const selectedType = e.target.value;
    setTicketType(selectedType);
    if (selectedType === "Choose") {
      setShowAttachments(false);
    } else {
      setShowAttachments(true);
    }
    if (errors.ticketType) setErrors(prev => ({ ...prev, ticketType: null }));
  };

  const handleRole = (e) => {
    const selectedRole = e.target.value;
    setRole(selectedRole);
    setShowDepartment(selectedRole === "Faculty");
    if (errors.role) setErrors(prev => ({ ...prev, role: null }));
  };

  const handleSubject = (e) => {
    setSubject(e.target.value);
    if (errors.subject) setErrors(prev => ({ ...prev, subject: null }));
  };

  const handleDetails = (value) => {
    setDetails(value);
    if (errors.details) setErrors(prev => ({ ...prev, details: null }));
  };


   
  useEffect(() => {
    if (localStorage.getItem('token') === "false") {
      localStorage.setItem("ClickedOnTicket",true)
       navigate("/signin")
       Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please login first to submit a request',
        showConfirmButton: true,
        timer: 3500,
        timerProgressBar: true,
    });
    
    }
  }, [navigate]);

  

  const validateForm = () => {
    const newErrors = {};
    if (!subject) newErrors.subject = "Subject is required.";
    if (!ticketType || ticketType === "Choose")
      newErrors.ticketType = "Please select a ticket type.";
    if (!role || role === "Choose")
      newErrors.role = "Please select a relation.";
    if (phone && !isValidPhone)
      newErrors.phone = "Domestic phone number should have at least 10 digits.";
    if (!details) newErrors.details = "Request details are required.";
  
    // For Resources Request (Solomon)
    if (ticketType === "Resources Request (Solomon)") {
      if (!files.length && !cloudLinks.some((link) => isURL(link))) {
        newErrors.attachmentOrLink =
          "For Resources Request (Solomon), please provide supporting materials or reference links.";
      }
    }
  
    return newErrors;
  };
  
  // Handle adding a new link
  const handleAddLink = () => {
  
  // Validate the URL before adding
  if (isURL(currentLink)) {
    setCloudLinks((prevLinks) => [...prevLinks, currentLink]);
    setCurrentLink("");
    setLinkError(null);
  } else {
    setLinkError("Please enter a valid URL.");
  }
  };
  
  // Remove a link from the list
  const handleRemoveLink = (index) => {
    setCloudLinks(prevLinks => prevLinks.filter((_, i) => i !== index));
  };
  

  const handleSubmit = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});
    if (!localStorage.getItem('token')) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please login to submit a ticket",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
      navigate('/signin');
      return;
    }
  
    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('department', department);
    formData.append('ticketType', ticketType);
    formData.append('role', role);
    formData.append('subject', subject);
    formData.append('details', details);
  
    // Add cloud links
    formData.append('cloudLinks', JSON.stringify(cloudLinks));
    formData.append('testTicket', testTicket); 
    console.log(formData);
  
    // Add attachments
    if (!useCloudLink || attachFileAfterLink) {
      files.forEach((attachment) => {
        if (attachment.file) {
          formData.append('attachments', attachment.file);
        }
      });
    }
    // Log FormData entries
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }
    try {
      // throw("Hello")
      await submitTicket(formData); // Pass navigate as a parameter
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to submit ticket. Please try again.\n Msg ${error}`,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    }
  };
  
  const handleFileAddition = (newFiles) => {
    const updatedFiles = [...files, ...newFiles];
  
    // Check file limit
    if (updatedFiles.length > 5) {
      Swal.fire({
        icon: "error",
        title: "File Limit Exceeded",
        text: "You can only upload up to 5 files.",
        showConfirmButton: true,
      });
      return;
    }
  
    setFiles(updatedFiles);
  };
  
  const handleFileRemoval = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  
  
  

  return (
  <div className="relative w-screen h-screen">
      <img
        src="/3D-Printing.jpg" // Replace with your image path
        alt="3D Printer"
        className="absolute w-full h-full object-cover"
      /> 
    <div className="mt-8 relative flex items-center justify-center w-[110%] h-[90%]  px-4 py-10">
      <div className="w-[90%] 2xl:w-[80%] xl:w-[70%] lg:w-[60%] md:[55%] sm:w-[50%] max-h-[120%] p-8 rounded-lg shadow-lg bg-white bg-opacity-100 overflow-y-auto 
      ">
        <legend className="text-2xl font-bold text-center mb-6 text-[#115175]">AI & QUANTUM INNOVATION LAB REQUEST</legend>
        <p className="text-center text-gray-600 mb-8 text-sm">
          Submit your request for AI/Quantum resources, collaboration opportunities, or consultation services
        </p>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-lg mb-2 text-gray-800">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`bg-gray-200 border ${errors.subject ? 'border-red-500' : 'border-gray-300'} text-gray-800 text-sm rounded-md block w-full p-2.5`}
              value={subject}
              onChange={handleSubject}
            />
            {errors.subject && <p className="text-red-500 text-sm">{errors.subject}</p>}
          </div>
      
          <div>
            <label className="block text-lg mb-2 text-gray-800">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              className={`bg-gray-200 border ${errors.ticketType ? 'border-red-500' : 'border-gray-300'} text-gray-800 text-sm rounded-md block w-full p-2.5`}
              value={ticketType}
              onChange={handleTicketType}
            >
              <option value="Choose">Choose</option>
              {dropdownData.ticketType.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.ticketType && <p className="text-red-500 text-sm">{errors.ticketType}</p>}
          </div>
  
          <div>
            <label className="block text-lg mb-2 text-gray-800">
              Affiliation <span className="text-red-500">*</span>
            </label>
            <select
              className={`bg-gray-200 border ${errors.role ? 'border-red-500' : 'border-gray-300'} text-gray-800 text-sm rounded-md block w-full p-2.5`}
              value={role}
              onChange={handleRole}
            >
              <option value="Choose">Choose</option>
              {dropdownData.role.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
          </div>
  
          <div>
            <label className="block text-lg mb-2 text-gray-800">
              Phone
            </label>
            <input
              type="text"
              className={`bg-gray-200 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} text-gray-800 text-sm rounded-md block w-full p-2.5`}
              value={phone}
              onChange={handlePhone}
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>
  
          {showDepartment && (
            <div>
              <label className="block text-lg mb-2 text-gray-800">Department</label>
              <select
                className="bg-gray-200 border border-gray-300 text-gray-800 text-sm rounded-md block w-full p-2.5"
                onChange={handleDepartment}
              >
                <option value="Choose">Choose</option>
                {dropdownData.department.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}
  
          {/*{showAttachments && (
            <div className="col-span-2">
              <label className="block text-lg mb-2 text-gray-800">
                Attachments {ticketType === "3d Printing Request" && <span className="text-red-500">*</span>}
              </label>
              <Attachments files={files} setFiles={setFiles} ticketType={ticketType} />
              {errors.files && <p className="text-red-500 text-sm">{errors.files}</p>}
            </div>
          )}*/}
          {/* Selection: Cloud Link or Attachment */}
          <div className="col-span-2">
  <label className="block text-lg mb-2 text-gray-800">
    Supporting Materials (Optional)
    {ticketType === "Resources Request (Solomon)" && <span className="text-red-500"> *</span>}
  </label>
  <p className="text-sm text-gray-500 mb-3">
    Upload documents, research papers, datasets, or provide links to relevant materials
  </p>
  <div className="flex items-center space-x-4">
    <label className="flex items-center cursor-pointer"> 
      <input
        type="checkbox"
        name="attachmentsCheckbox"
        checked={showAttachments}
        onChange={() => setShowAttachments((prev) => !prev)}
        className="w-4 h-4 text-[#115175] border-gray-300 rounded focus:ring-[#115175]"
      />
      <span className="ml-2 text-gray-700">Upload Files</span>
    </label>
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        name="urlCheckbox"
        checked={showLinks}
        onChange={() => setShowLinks((prev) => !prev)}
        className="w-4 h-4 text-[#115175] border-gray-300 rounded focus:ring-[#115175]"
      />
      <span className="ml-2 text-gray-700">Share Links</span>
    </label>
  </div>
</div>
{showAttachments && (
  <div className="col-span-2">
  <label className="block text-lg mb-2 text-gray-800">
    Upload Supporting Documents
  </label>
  <Attachments files={files} setFiles={setFiles} ticketType={ticketType} />
  {/* Show file upload guidelines */}
  <p className="text-xs text-gray-500 mt-2">
    Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG (Max 5 files)
  </p>
</div>
)}
  

          {/* Cloud Link Section */}
          {/* Google Drive Links Section */}
          {showLinks && (
  <div className="col-span-2">
    <label className="block text-lg mb-2 text-gray-800">
      Reference Links
    </label>
    <div className="flex items-center space-x-2">
      <input
        type="url"
        placeholder="Enter research papers, datasets, or relevant resource links"
        value={currentLink}
        onChange={(e) => setCurrentLink(e.target.value)}
        className="bg-gray-200 border border-gray-300 text-gray-800 text-sm rounded-md block w-full p-2.5"
      />
      <button
        type="button"
        onClick={handleAddLink}
        className="p-2 text-green-600 hover:text-green-800"
        title="Confirm Link"
      >
        <FaCheck />
      </button>
    </div>
    {linkError && (
      <p className="text-red-500 text-sm mt-2">{linkError}</p>
    )}
    {cloudLinks.length > 0 && (
      <ul className="mt-4 space-y-2">
        {cloudLinks.map((link, index) => (
          <li
            key={index}
            className="flex items-center justify-between bg-gray-100 p-2 rounded"
          >
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {link}
            </a>
            <button
              type="button"
              onClick={() => handleRemoveLink(index)}
              className="p-2 text-red-600 hover:text-red-800"
              title="Remove Link"
            >
              <FaTrash />
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)}



{errors.attachmentOrLink && (
  <p className="text-red-500 text-sm col-span-2">
    {errors.attachmentOrLink}
  </p>
)}
  
          <div className="col-span-2">
            <label className="text-lg mb-2 text-gray-800">
              Project Description <span className="text-red-500">*</span>
            </label>
            <ReactQuill className="mb-5 h-[20vh] bg-white" theme="snow" value={details} onChange={handleDetails} />
            {errors.details && <p className="text-red-500 text-sm">{errors.details}</p>}
          </div>

          <div>
          <label>
    <input 
      mt = "20"
      type="checkbox"
      checked={testTicket}
      onChange={() => setTestTicket(!testTicket)}
    />
    This is a Test Ticket (no emails will be sent to admin)
  </label>
</div>
  
          <div className="flex space-x-4 col-span-2 mt-8">
            <button
              type="button"
              onClick={() => {
                setPhone('');
                setDepartment('Choose');
                setTicketType('Choose');
                setRole('Choose');
                setSubject('');
                setDetails('');
                setFiles([]);
                setErrors({});
              }}
              className="text-white bg-[#7d3f3a] hover:bg-[#3a2129] rounded-md text-sm px-6 py-2"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                handleSubmit()}}
              className="text-white bg-[#0098ff] hover:bg-[#1f2937] rounded-md text-sm px-6 py-2"
            >
              Submit
            </button>
          </div>
        </form>
        
      </div>
      </div>
  `</div> 
  );
  
 
}
  
  export default Tickets;
  
