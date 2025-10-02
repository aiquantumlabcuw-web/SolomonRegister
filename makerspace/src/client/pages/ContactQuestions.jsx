import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader';
import { FaReply, FaTrash } from 'react-icons/fa';
import './ContactQuestions.css';
import Swal from 'sweetalert2';
import GlobalConfig from '../../../config/GlobalConfig';

const ContactQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(9);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage(1);
    const fetchQuestions = async () => {
      try {
        const queryParams = new URLSearchParams({
          searchTerm,
          status: statusFilter,
        }).toString();

        const response = await fetch(`${GlobalConfig.nodeUrl}/apicontact/getAllQuestions?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleOpen = async (id, status) => {
    setOperationLoading(true);
    try {
      if (status === 'new' || status === 'review later') {
        await fetch(`${GlobalConfig.nodeUrl}/apicontact/updateQuestionStatus/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'In Review' }),
        });
      }
      setOperationLoading(false);
      navigate(`/QuestionView/${id}`);
    } catch (error) {
      console.error('Failed to update status to In Review:', error);
      setOperationLoading(false);
    }
  };


  const deleteQuestion = async (id) => {
    const question = questions.find(q => q._id === id);

    let confirmMessage = question.response
      ? 'Are you sure you want to delete this question?'
      : 'This question has not been responded to. Are you sure you want to delete it?';

    Swal.fire({
      title: 'Confirm Deletion',
      text: confirmMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await performDelete(id); // Call the delete function
      }
    });
  };


  const performDelete = async (id) => {
    setOperationLoading(true);
    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/apicontact/deleteQuestion/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      setQuestions(prevQuestions => prevQuestions.filter(q => q._id !== id));
      Swal.fire('Deleted!', 'The question has been deleted.', 'success');
    } catch (error) {
      console.error('Failed to delete question:', error);
      Swal.fire('Error', 'Failed to delete question', 'error');
    } finally {
      setOperationLoading(false);
    }
  };

  const confirmDeleteWithoutResponse = async () => {
    if (!questionToDelete) return;

    setOperationLoading(true);
    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/apicontact/deleteQuestion/${questionToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      setQuestions(prevQuestions => prevQuestions.filter(q => q._id !== questionToDelete));
    } catch (error) {
      console.error('Failed to delete question:', error);
    } finally {
      setShowConfirmDelete(false);
      setOperationLoading(false);
    }
  };

  const handleStatusDropdownChange = (id, newStatus) => {
    const question = questions.find(q => q._id === id);
    updateStatus(id, newStatus);
  };

  const updateStatus = async (id, newStatus) => {
    setOperationLoading(true);
    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/apicontact/updateQuestionStatus/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status to ${newStatus}`);
      }

      // Refetch questions using the current filter after updating the status
      const queryParams = new URLSearchParams({
        searchTerm,
        status: statusFilter, // This uses the current status filter
      }).toString();

      const filteredResponse = await fetch(`${GlobalConfig.nodeUrl}/apicontact/getAllQuestions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!filteredResponse.ok) {
        throw new Error('Failed to fetch filtered questions');
      }

      const filteredData = await filteredResponse.json();
      setQuestions(filteredData);

    } catch (error) {
      console.error(`Failed to update status to ${newStatus}:`, error);
    } finally {
      setOperationLoading(false);
    }
  };
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;

  // Paginated questions
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(questions.length / questionsPerPage);


  return (
    <div className="max-w-full mx-auto p-2 relative">
      <div className="flex justify-between mb-5">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearchChange}
          className="px-4 py-2 text-base rounded-md border border-gray-300 w-1/2"
        />
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="px-4 py-2 text-base rounded-md border border-gray-300 w-1/4"
        >
          <option value="">All</option>
          <option value="new">New</option>
          <option value="In Review">In Review</option>
          <option value="review later">Review Later</option>
          <option value="responded">Responded</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <ClipLoader color="#080f9c" loading={loading} size={50} />
        </div>
      ) : (
        <div className="w-[100%] overflow-x-auto">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr>
                {/* <th className="px-4 py-2 border-b border-gray-300 text-left">Name</th> */}
                <th className="px-4 py-2 border-b border-gray-300 text-left">Email</th>
                <th className="px-4 py-2 border-b border-gray-300 text-left">Question</th>
                <th className="px-4 py-2 border-b border-gray-300 text-left">Status</th>
                <th className="px-4 py-2 border-b border-gray-300 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentQuestions.map((question) => (
                <tr key={question._id} className={`${question.status === 'new' ? 'font-bold bg-gray-100' : ''} text-xs`}>
                  {/* <td className="px-4 py-2">{question.Name.length > 14 ? `${question.Name.substring(0, 12)}...` : question.Name}</td> */}
                  <td className="px-4 py-2">{question.email.length > 25 ? `${question.email.substring(0, 20)}...` : question.email}</td>
                  <td className="px-4 py-2 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {question.question.length > 100
                      ? `${question.question.substring(0, 100)}...`
                      : question.question
                    }
                    {question.question.length > 100 && (
                      <span
                        className="text-teal-600 cursor-pointer ml-2 text-sm hover:underline"
                        onClick={() =>
                          Swal.fire({
                            icon: 'info',
                            title: 'Question',
                            text: question.question,
                            showConfirmButton: false,
                            showCloseButton: true,
                          })
                        }
                      >
                        Read more
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className={`w-24 px-3 py-1 border border-gray-300 rounded-md bg-gray-50 text-sm ${question.status.toLowerCase().replace(' ', '-')}`}
                      value={question.status}
                      onChange={(e) => handleStatusDropdownChange(question._id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="In Review">In Review</option>
                      <option value="review later">Review Later</option>
                      <option value="responded">Responded</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-800 mr-2"
                      onClick={() => handleOpen(question.uniqueId, question.status)}
                      title="View Question"
                    >
                      <FaReply />
                    </button>
                    <button
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                      onClick={() => deleteQuestion(question._id)}
                      title="Delete Question"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div>Loading...</div>}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`mx-1 px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-300 text-gray-500' : 'bg-gray-300 text-black hover:bg-gray-400'}`}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`mx-1 px-3 py-1 rounded-md ${currentPage === index + 1 ? 'bg-teal-600 text-white' : 'bg-gray-300 text-black hover:bg-gray-400'}`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`mx-1 px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-300 text-gray-500' : 'bg-gray-300 text-black hover:bg-gray-400'}`}
            >
              Next
            </button>
          </div>

        </div>
      )}

      {operationLoading && (
        <div className="text-center text-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <ClipLoader color="#080f9c" loading={operationLoading} size={50} />
        </div>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-md shadow-md w-96">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6">This question has not been responded to. Are you sure you want to delete it?</p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-800"
                onClick={confirmDeleteWithoutResponse}
              >
                Yes, Delete
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default ContactQuestions;