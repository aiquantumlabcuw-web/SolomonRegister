import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import EmailTemplateEditor from '../components/EmailTemplateEditor';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedTemplate) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${updatedTemplate.type}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTemplate),
      });

      if (!response.ok) throw new Error('Failed to update template');

      await fetchTemplates();
      setIsEditing(false);
      setSelectedTemplate(null);
      toast.success('Template updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const templateTypes = {
    'Ticket Templates': ['ticketSubmission', 'ticketSubmissionAdmin', 'ticketStatusUpdate'],
    'FAQ Templates': ['faqSubmission', 'faqResponse'],
    'Order Templates': ['orderCreated', 'orderStatusUpdate', 'orderShipped', 'orderDelivered']
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Email Template Management</h1>

      {isEditing ? (
        <EmailTemplateEditor
          template={selectedTemplate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(templateTypes).map(([category, types]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-semibold">{category}</h2>
              <div className="bg-white rounded-lg shadow divide-y">
                {types.map(type => {
                  const template = templates.find(t => t.type === type);
                  return (
                    <div
                      key={type}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsEditing(true);
                      }}
                    >
                      <h3 className="font-medium">{template?.name || type}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Last modified: {template?.lastModified
                          ? new Date(template.lastModified).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTemplates; 