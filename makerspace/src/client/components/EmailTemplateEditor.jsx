import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'react-hot-toast';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'link'
];

const EmailTemplateEditor = ({ template, onSave, onCancel }) => {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [variables, setVariables] = useState(template?.variables || []);
  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
      setVariables(template.variables);
    }
  }, [template]);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await onSave({
        ...template,
        name,
        subject,
        body,
        variables
      });
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Error saving template:', error);
    }
  };

  const addVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable('');
    }
  };

  const removeVariable = (variable) => {
    setVariables(variables.filter(v => v !== variable));
  };

  const insertVariable = (variable) => {
    const variableText = `{${variable}}`;
    setBody(body + variableText);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter template name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter email subject"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Variables
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newVariable}
            onChange={(e) => setNewVariable(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add new variable"
          />
          <button
            onClick={addVariable}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <div
              key={variable}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
            >
              <span
                className="cursor-pointer text-blue-500 hover:text-blue-600"
                onClick={() => insertVariable(variable)}
              >
                {variable}
              </span>
              <button
                onClick={() => removeVariable(variable)}
                className="text-red-500 hover:text-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Body
        </label>
        <ReactQuill
          theme="snow"
          value={body}
          onChange={setBody}
          modules={modules}
          formats={formats}
          className="bg-white"
        />
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Template
        </button>
      </div>
    </div>
  );
};

export default EmailTemplateEditor; 