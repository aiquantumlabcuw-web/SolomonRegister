import React, { useState, useEffect } from "react";
import GlobalConfig from '../../../config/GlobalConfig';

const TicketAdminEmailer = () => {
    const defaultEmailState = { siteOwner: [], ticket: [], faq: [] };
    const [email, setEmail] = useState(defaultEmailState);
    const [searchTerm, setSearchTerm] = useState({ siteOwner: '', ticket: '', faq: '' });
    const [newEmail, setNewEmail] = useState({ siteOwner: '', ticket: '', faq: '' });

    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const response = await fetch(`${GlobalConfig.nodeUrl}/admin/getCurrentEmailAdmin`, {
                    headers: {
                        "Authorization": `${sessionStorage.getItem("token")}`
                    }
                });
                const data = await response.json();
                setEmail(data.emails || defaultEmailState);
                setEmail(data.emails);
            } catch (error) {
                console.error("Error fetching emails:", error);
            }
        };
        fetchEmail();
    }, []);

    const handleAddEmail = async (type) => {
        if (!newEmail[type] || !newEmail[type].trim()) {
            alert("Please enter a valid email address");
            return;
        }

        try {
            const response = await fetch(`${GlobalConfig.nodeUrl}/admin/updateEmailAdmin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${sessionStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    emailType: type,
                    email: newEmail[type].trim()
                })
            });

            const data = await response.json();
            if (data.success) {
                setEmail(prevEmails => ({
                    ...prevEmails,
                    [type]: [...prevEmails[type], newEmail[type].trim()]
                }));
                setNewEmail(prev => ({ ...prev, [type]: '' }));
            } else {
                alert("Failed to add email.");
            }
        } catch (error) {
            console.error("Error adding email:", error);
            alert("Failed to add email.");
        }
    };

    const handleDeleteEmail = async (type, emailToDelete) => {
        try {
            const response = await fetch(`${GlobalConfig.nodeUrl}/admin/deleteEmailAdmin`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${sessionStorage.getItem("token")}`
                },
                body: JSON.stringify({ emailType: type, email: emailToDelete })
            });

            const data = await response.json();
            if (data.success) {
                setEmail(prevEmails => ({
                    ...prevEmails,
                    [type]: prevEmails[type].filter(emailItem => emailItem !== emailToDelete)
                }));
            } else {
                alert(data.error || "Failed to delete email.");
            }
        } catch (error) {
            console.error("Error deleting email:", error);
            alert("Failed to delete email.");
        }
    };

    const handleSearchChange = (type, value) => {
        setSearchTerm(prev => ({ ...prev, [type]: value }));
    };

    const filteredEmails = (type) => {
        return (email[type] ?? []).filter(emailItem =>
            emailItem.toLowerCase().includes(searchTerm[type].toLowerCase())
        );
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 mx-auto w-full p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full">
                <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900">Manage Admin Emails</h2>
                <div className="max-h-[100vh] overflow-y-auto">
                    {['siteOwner', 'ticket', 'faq'].map((type) => (
                        <div key={type} className="flex flex-col">
                            <label className="block text-base font-medium text-gray-700 mb-2 capitalize">{type}</label>
                            
                            {/* Search Bar */}
                            <div className="mb-2">
                                <input
                                    type="text"
                                    placeholder="Search emails..."
                                    value={searchTerm[type]}
                                    onChange={(e) => handleSearchChange(type, e.target.value)}
                                    className="w-full p-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Email List */}
                            <div className="h-32 overflow-y-auto border border-gray-200 rounded-lg mb-2 bg-white shadow-sm">
                                {filteredEmails(type).length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                        No emails found
                                    </div>
                                ) : (
                                    filteredEmails(type).map((emailItem, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                                            <span className="text-gray-700 truncate text-sm">{emailItem}</span>
                                            <button
                                                className="p-1 text-red-600 hover:text-red-800 transition duration-300 rounded-full hover:bg-red-50"
                                                onClick={() => handleDeleteEmail(type, emailItem)}
                                                title="Delete email"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add New Email */}
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={newEmail[type]}
                                    onChange={(e) => setNewEmail(prev => ({ ...prev, [type]: e.target.value }))}
                                    placeholder="Enter new email"
                                    className="flex-1 p-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition duration-300"
                                    onClick={() => handleAddEmail(type)}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TicketAdminEmailer;
