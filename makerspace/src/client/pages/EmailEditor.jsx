import React, { useState, useEffect } from "react";
import GlobalConfig from '../../../config/GlobalConfig';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Swal from 'sweetalert2';
const EmailEditor = () => {
    const [templates, setTemplates] = useState({
        ticketSubmission: { subject: '', body: '', variables: [] },
        ticketSubmissionAdmin: { subject: '', body: '', variables: [] },
        ticketStatusUpdate: { subject: '', body: '', variables: [] },
        faqSubmission: { subject: '', body: '', variables: [] },
        faqResponse: { subject: '', body: '', variables: [] }
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ticketSubmission');
    const [saving, setSaving] = useState(false);
    const [editorKey, setEditorKey] = useState(0); // Add key for forcing re-render

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                toast.error('Please login to access this feature');
                return;
            }

            const response = await fetch(`${GlobalConfig.nodeUrl}/admin/getEmailTemplates`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('Session expired. Please login again');
                    window.location.href = '/signin';
                    return;
                }
                throw new Error('Failed to fetch templates');
            }

            const data = await response.json();
            if (data.success && Array.isArray(data.templates)) {
                const templateObject = data.templates.reduce((acc, template) => {
                    if (template && template.type) {
                        acc[template.type] = {
                            subject: template.subject || '',
                            body: template.body || '',
                            variables: template.variables || []
                        };
                    }
                    return acc;
                }, {
                    ticketSubmission: { subject: '', body: '', variables: [] },
                    ticketSubmissionAdmin: { subject: '', body: '', variables: [] },
                    ticketStatusUpdate: { subject: '', body: '', variables: [] },
                    faqSubmission: { subject: '', body: '', variables: [] },
                    faqResponse: { subject: '', body: '', variables: [] }
                });
                setTemplates(templateObject);
            } else {
                toast.error('Invalid template data received');
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Error loading email templates');
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateChange = (type, field, value) => {
        setTemplates(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    const handleTabChange = (type) => {
        setActiveTab(type);
        setEditorKey(prev => prev + 1); // Force re-render of ReactQuill
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = sessionStorage.getItem('token');
            if (!token) {
                toast.error('Please login to access this feature');
                return;
            }

            const currentTemplate = templates[activeTab];
            if (!currentTemplate?.subject || !currentTemplate?.body) {
                toast.error('Subject and body are required');
                return;
            }

            const response = await fetch(`${GlobalConfig.nodeUrl}/admin/updateEmailTemplate`, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: activeTab,
                    subject: currentTemplate.subject,
                    body: currentTemplate.body
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('Session expired. Please login again');
                    window.location.href = '/signin';
                    return;
                }
                throw new Error('Failed to update template');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Template updated successfully');
                // Refresh templates after save
                await fetchTemplates();
            } else {
                toast.error(data.error || 'Failed to update template');
            }
        } catch (error) {
            console.error('Error updating template:', error);
            toast.error('Error updating template');
        } finally {
            setSaving(false);
        }
    };

    const handleDragStart = (event, variable) => {
        event.dataTransfer.setData('text/plain', variable);
    };

    const handleDrop = (event, field) => {
        event.preventDefault();
        const variable = event.dataTransfer.getData('text/plain');

        if (field === 'subject') {
            const input = document.querySelector('input');
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const value = templates[activeTab]?.subject || '';

            const updatedValue = value.slice(0, start) + variable + value.slice(end);
            handleTemplateChange(activeTab, 'subject', updatedValue);

            // Set cursor position after the inserted variable
            setTimeout(() => {
                input.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        } else if (field === 'body') {
            const quill = document.querySelector('.ql-container').__reactQuillRef.getEditor();
            const range = quill.getSelection();

            if (range) {
                quill.insertText(range.index, variable);
            }
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Email Template Editor</h1>
            
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6 border-b">
                {Object.keys(templates).map((type) => (
                    <button
                        key={type}
                        onClick={() => handleTabChange(type)}
                        className={`px-4 py-2 ${
                            activeTab === type
                                ? 'border-b-2 border-blue-500 text-blue-500'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Template Editor */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                    </label>
                    <input
                        type="text"
                        value={templates[activeTab]?.subject || ''}
                        onChange={(e) => handleTemplateChange(activeTab, 'subject', e.target.value)}
                        onDrop={(e) => handleDrop(e, 'subject')}
                        onDragOver={handleDragOver}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter email subject"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Body
                    </label>
                    <ReactQuill
                        key={editorKey} // Add key prop for forcing re-render
                        value={templates[activeTab]?.body || ''}
                        onChange={(value) => handleTemplateChange(activeTab, 'body', value)}
                        onDrop={(e) => handleDrop(e, 'body')}
                        onDragOver={handleDragOver}
                        className="h-64 mb-12"
                        modules={{
                            toolbar: [
                                [{ 'header': [1, 2, 3, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                ['link', 'clean']
                            ]
                        }}
                    />
                </div>

                <div className="mt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 ${
                            saving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {saving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>

                        <div className="mt-8 p-4 bg-gray-50 rounded-md">
                            <h2 className="text-lg font-semibold mb-2">Available Variables</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              
                                                    <div>
                                                        <h3 className="font-medium mb-2">Common Variables</h3>
                                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                            <li
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, '{userName}')}
                                                                onClick={(e) => {
                                                                    navigator.clipboard.writeText('{userName}');
                                                                
                                                                    // toast.success('Variable {userName} copied!', {
                                                                    //     position: 'top-center', // Adjust position to top-center
                                                                    // });
                                                                    Swal.fire({
                                                                        title: 'Variable Copied!',
                                                                        text: '{userName} copied to clipboard!',
                                                                    })
                                                                }}
                                                                className="cursor-pointer text-blue-500 hover:underline"
                                                            >
                                                                {'{userName}'} - User&apos;s name
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    {/* Ticket Variables */}
                    <ul>
                        <h3 className="font-medium mb-2">Ticket Variables</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600"></ul>
                            <li
                                draggable
                                onDragStart={(e) => handleDragStart(e, '{ticketId}')}
                                onClick={(e) => {
                                    navigator.clipboard.writeText('{ticketId}');
                                
                                    toast.success('Variable {ticketId} copied!');
                                }}
                                className="cursor-pointer text-blue-500 hover:underline"
                            >
                                {'{ticketId}'} - Ticket ID
                            </li>
                            <li
                                draggable
                                onDragStart={(e) => handleDragStart(e, '{ticketTitle}')}
                                onClick={(e) => {
                                    navigator.clipboard.writeText('{ticketTitle}');
                           
                                    toast.success('Variable {ticketTitle} copied!');
                                }}
                                className="cursor-pointer text-blue-500 hover:underline"
                            >
                                {'{ticketTitle}'} - Ticket title
                            </li>
                            <li
                                draggable
                                onDragStart={(e) => handleDragStart(e, '{ticketType}')}
                                onClick={(e) => {
                                    navigator.clipboard.writeText('{ticketType}');
                                    toast.success('Variable {ticketType} copied!');
                                }}
                                className="cursor-pointer text-blue-500 hover:underline"
                            >
                                {'{ticketType}'} - Ticket type
                            </li>
                            <li
                                draggable
                                onDragStart={(e) => handleDragStart(e, '{ticketDetails}')}
                                onClick={(e) => {
                                    navigator.clipboard.writeText('{ticketDetails}');
                                    toast.success('Variable {ticketDetails} copied!');
                                }}
                                className="cursor-pointer text-blue-500 hover:underline"
                            >
                                {'{ticketDetails}'} - Ticket details
                            </li>
                            <li
                                draggable
                                onDragStart={(e) => handleDragStart(e, '{status}')}
                                onClick={(e) => {
                                    navigator.clipboard.writeText('{status}');
                                    toast.success('Variable {status} copied!');
                                }}
                                className="cursor-pointer text-blue-500 hover:underline"
                            >
                                {'{status}'} - Ticket status
                            </li>
                            <li
                                draggable
                                onDragStart={(e) => handleDragStart(e, '{updatedBy}')}
                                onClick={(e) => {
                                    navigator.clipboard.writeText('{updatedBy}');
                                    toast.success('Variable {updatedBy} copied!');
                                }}
                                className="cursor-pointer text-blue-500 hover:underline"
                            >
                                {'{updatedBy}'} - Updated by
                            </li>
                    </ul>
                    

                    {/* FAQ Variables */}
                    <div>
                        <h3 className="font-medium mb-2">FAQ Variables</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            <li
                                draggable
                                onDragStart={(e) => handleDragStart(e, '{question}')}
                                onClick={(e) => {
                                    navigator.clipboard.writeText('{question}');
                                    toast.success('Variable {question} copied!');
                                }}
                                className="cursor-pointer text-blue-500 hover:underline"
                            >
                                {'{question}'} - FAQ/Contact question
                            </li>
                            <li
                                draggable
                                onDragStart={(e) => handleDragStart(e, '{answer}')}
                                onClick={(e) => {
                                    navigator.clipboard.writeText('{answer}');

                                    toast.success('Variable {answer} copied!');
                                }}
                                className="cursor-pointer text-blue-500 hover:underline"
                            >
                                {'{answer}'} - FAQ/Contact answer
                            </li>
                        </ul>
                    </div>
                    </div>
                </div>
            </div>
    );
};

export default EmailEditor;