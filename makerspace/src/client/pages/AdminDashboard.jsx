import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [failedLogins, setFailedLogins] = useState([]);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({ description: '', threshold: '', duration: '', action: '' });
  const [auditLogs, setAuditLogs] = useState([]);
  const [overrideIP, setOverrideIP] = useState('');
  const [altRule, setAltRule] = useState('');
  
  // Fetch failed login statuses
  useEffect(() => {
    fetchFailedLogins();
    fetchRules();
    fetchAuditLogs();
  }, []);

  const fetchFailedLogins = async () => {
    try {
      const res = await axios.get(`${GlobalConfig.nodeUrl}/admin/allfailedlogin`, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      setFailedLogins(res.data.failedLogins);
    } catch (error) {
      console.error("Error fetching failed logins", error);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await axios.get(`${GlobalConfig.nodeUrl}/admin/getAllRules`, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      setRules(res.data.rules);
    } catch (error) {
      console.error("Error fetching rules", error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get(`${GlobalConfig.nodeUrl}/admin/getAuditLogs`, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      setAuditLogs(res.data.logs);
    } catch (error) {
      console.error("Error fetching audit logs", error);
    }
  };

  const addRule = async () => {
    try {
      const res = await axios.post(`${GlobalConfig.nodeUrl}/admin/createRule`, newRule, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      alert(res.data.msg);
      fetchRules();
      setNewRule({ description: '', threshold: '', duration: '', action: '' });
    } catch (error) {
      console.error("Error adding rule", error);
      alert("Error adding rule");
    }
  };

  const updateRule = async (ruleId, updateData) => {
    try {
      const res = await axios.put(`${GlobalConfig.nodeUrl}/admin/updateRule/${ruleId}`, updateData, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      alert(res.data.msg);
      fetchRules();
    } catch (error) {
      console.error("Error updating rule", error);
      alert("Error updating rule");
    }
  };

  const deleteRule = async (ruleId) => {
    try {
      const res = await axios.delete(`${GlobalConfig.nodeUrl}/admin/deleteRule/${ruleId}`, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      alert(res.data.msg);
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule", error);
      alert("Error deleting rule");
    }
  };

  const pauseAndApplyAlternative = async () => {
    // This function pauses the current rule for a given IP and applies an alternative rule.
    // For simplicity, we use the assignRule endpoint.
    try {
      const payload = { mac: overrideIP, fingerprint: overrideIP, ruleId: altRule };
      const res = await axios.post(`${GlobalConfig.nodeUrl}/admin/assign-rule`, payload, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      alert(`Alternative rule ${altRule} applied to IP ${overrideIP}`);
      fetchFailedLogins();
    } catch (error) {
      console.error("Error applying alternative rule", error);
      alert("Error applying alternative rule");
    }
  };

  const manualOverrideClear = async (ipOrMac) => {
    // For manual override, we call the unblock endpoint.
    try {
      const payload = { mac: ipOrMac, fingerprint: ipOrMac };
      const res = await axios.post(`${GlobalConfig.nodeUrl}/admin/unblock-user`, payload, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      alert(res.data.msg);
      fetchFailedLogins();
    } catch (error) {
      console.error("Error overriding block", error);
      alert("Error overriding block");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      {/* Block Status & History */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Current Block Statuses & Login Attempt Histories</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th>IP</th>
              <th>Failed Attempts</th>
              <th>Block Expires</th>
              <th>Status</th>
              <th>Manual Override</th>
            </tr>
          </thead>
          <tbody>
            {failedLogins.map((login, idx) => (
              <tr key={idx} className="border-t">
                <td>{login.ip || login.mac}</td>
                <td>{login.failedAttempts}</td>
                <td>{login.blockExpires ? new Date(login.blockExpires).toLocaleString() : "N/A"}</td>
                <td>{login.status}</td>
                <td>
                  <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => manualOverrideClear(login.ip || login.mac)}>
                    Clear Block
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      {/* Rule Management */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Rule Management</h2>
        <div className="mb-4">
          <h3 className="font-semibold">Add New Rule</h3>
          <input
            type="text"
            placeholder="Description"
            className="border rounded p-1 mr-2"
            value={newRule.description}
            onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Threshold"
            className="border rounded p-1 mr-2"
            value={newRule.threshold}
            onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
          />
          <input
            type="number"
            placeholder="Duration (ms)"
            className="border rounded p-1 mr-2"
            value={newRule.duration}
            onChange={(e) => setNewRule({ ...newRule, duration: e.target.value })}
          />
          <input
            type="text"
            placeholder="Action"
            className="border rounded p-1 mr-2"
            value={newRule.action}
            onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
          />
          <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={addRule}>
            Add Rule
          </button>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Existing Rules</h3>
          <table className="w-full border">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Threshold</th>
                <th>Duration</th>
                <th>Action</th>
                <th>Operations</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule._id} className="border-t">
                  <td>{rule._id}</td>
                  <td>{rule.description}</td>
                  <td>{rule.threshold}</td>
                  <td>{rule.duration / 60000} mins</td>
                  <td>{rule.action}</td>
                  <td>
                    <button className="bg-yellow-500 text-white px-2 py-1 rounded mr-2" onClick={() => updateRule(rule._id, { paused: true })}>
                      Pause
                    </button>
                    <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2" onClick={() => updateRule(rule._id, { description: rule.description + " (Modified)" })}>
                      Modify
                    </button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => deleteRule(rule._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pause Rule & Apply Alternative */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Pause Rule & Apply Alternative</h2>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Enter IP/MAC"
            className="border rounded p-1 mr-2"
            value={overrideIP}
            onChange={(e) => setOverrideIP(e.target.value)}
          />
          <select
            className="border rounded p-1 mr-2"
            value={altRule}
            onChange={(e) => setAltRule(e.target.value)}
          >
            <option value="" disabled>Select alternative rule</option>
            {rules.map(rule => (
              <option key={rule._id} value={rule._id}>{rule.description}</option>
            ))}
          </select>
          <button className="bg-purple-500 text-white px-3 py-1 rounded" onClick={pauseAndApplyAlternative}>
            Apply Alternative
          </button>
        </div>
      </section>

      {/* Audit Trail */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Audit Trail</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, idx) => (
              <tr key={idx} className="border-t">
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
