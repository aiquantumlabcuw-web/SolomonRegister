import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './QuestionView.css';
import GlobalConfig from '../../../config/GlobalConfig';
const QuestionView = () => {
  const { uniqueId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState({});
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmStatusChange, setShowConfirmStatusChange] = useState(false);
  const [statusToChange, setStatusToChange] = useState('');

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`${GlobalConfig.nodeUrl}/apicontact/getQuestionById/${uniqueId}`);
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await res.json();

        if (data.status === 'new' || data.status === 'review later') {
          await fetch(`${GlobalConfig.nodeUrl}/apicontact/updateQuestionStatus/${data._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'In Review' }),
          });
          data.status = 'In Review'; // Update local state to reflect change
        }

        setQuestion(data);
      } catch (error) {
        console.log(error);
        Swal.fire('Error', 'Failed to fetch question details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [uniqueId]);

  const handleResponseChange = (e) => {
    setResponse(e.target.value);
  };

  const handleResponseSubmit = async () => {
    if (!response) {
      Swal.fire('Warning', 'Response cannot be empty', 'warning');
      return;
    }

    setOperationLoading(true);
    try {
      const res = await fetch(`${GlobalConfig.nodeUrl}/apicontact/respondToQuestion/${question._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      await fetch(`${GlobalConfig.nodeUrl}/apicontact/updateQuestionStatus/${question._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'responded' }),
      });

      //Swal.fire('Success', 'Response sent successfully!', 'success');
      navigate('/ContactQuestions');
    } catch (error) {
      console.log(error);
     // Swal.fire('Error', 'Failed to send response', 'error');
    } finally {
      setOperationLoading(false);
    }
  };

  const deleteQuestion = async () => {
    if (await Swal.fire({
      title: 'Confirm Deletion',
      text: question.response 
            ? 'Are you sure you want to delete this question?' 
            : 'This question has not been responded to. Are you sure you want to delete it?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
  }).then(result => result.isConfirmed)) {
      setOperationLoading(true);
      try {
          const response = await fetch(`${GlobalConfig.nodeUrl}/apicontact/deleteQuestion/${question._id}`, {
              method: 'DELETE',
          });
  
          if (!response.ok) {
              throw new Error('Failed to delete question');
          }
  
          Swal.fire('Success', 'Question deleted successfully', 'success');
          navigate('/ContactQuestions');
      } catch (error) {
          console.error('Failed to delete question:', error);
          Swal.fire('Error', 'Failed to delete question', 'error');
      } finally {
          setOperationLoading(false);
      }
  }
  
  };

  const handleStatusChange = async (newStatus) => {
      updateStatus(newStatus);
  };

  const updateStatus = async (newStatus) => {
    setOperationLoading(true);
    try {
      await fetch(`${GlobalConfig.nodeUrl}/apicontact/updateQuestionStatus/${question._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setQuestion((prev) => ({ ...prev, status: newStatus }));
      if (newStatus === 'closed') {
        setResponse(''); // Clear response if status is closed
      }
      //Swal.fire('Success', 'Status updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      //Swal.fire('Error', 'Failed to update status', 'error');
    } finally {
      setOperationLoading(false);
      setShowConfirmStatusChange(false);
    }
  };

  return (
    <div className="question-view-container">
      {loading ? (
        <div className="loading-container">
          <ClipLoader color="#080f9c" loading={loading} size={50} />
        </div>
      ) : (
        <div className="question-card">
          <nav className="breadcrumb-nav">
            <Link to="/ContactQuestions"><FaArrowLeft /> Back to Contact Questions</Link>
          </nav>

          <div className="question-header">
            <h2>Question Details</h2>
            <div className="status-menu">
              <select
                className={`status-dropdown ${question.status.toLowerCase().replace(' ', '-')}`}
                value={question.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="new">New</option>
                <option value="In Review">In Review</option>
                <option value="responded">Responded</option>
                <option value="review later">Review Later</option>
                <option value="closed">Closed</option>
              </select>
              <button className="delete-button" onClick={deleteQuestion}>
                <FaTrash />
              </button>
            </div>
          </div>

          <div className="question-info">
            <p><strong>Name:</strong> {question.Name}</p>
            <p><strong>Email:</strong> {question.email}</p>
            <p className="question-text"><strong>Question:</strong> {question.question}</p>
          </div>

          {question.status !== 'closed' && (
            <div className="response-section">
              <h3><strong>Response:</strong></h3>
              {question.response &&
                <div>
                  <p>{question.response}</p>
                </div>
              }
              {question.status !== 'responded' && (
                <textarea
                  className="response-textarea"
                  value={response}
                  onChange={handleResponseChange}
                  placeholder="Type your response here..."
                />
              )}
            </div>
          )}

          {question.status !== 'responded' && (
            <div className="actions-container">
              <button className="response-button" onClick={handleResponseSubmit}>
                Send Response
              </button>
            </div>
          )}
        </div>
      )}
      {operationLoading && (
        <div className="operation-loading-container">
          <ClipLoader color="#080f9c" loading={operationLoading} size={50} />
        </div>
      )}

      {showConfirmStatusChange && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Confirm Status Change</h2>
            <p>This question has not been responded to. Are you sure you want to change the status to {statusToChange}?</p>
            <div className="modal-actions">
              <button className="primary-button" onClick={() => updateStatus(statusToChange)}>
                Yes, Change Status
              </button>
              <button className="secondary-button" onClick={() => setShowConfirmStatusChange(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
 
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Confirm Deletion</h2>
            <p>This question has not been responded to. Are you sure you want to delete it?</p>
            <div className="modal-actions">
              <button className="primary-button" onClick={deleteQuestion}>
                Yes, Delete
              </button>
              <button className="secondary-button" onClick={() => setShowConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionView;
