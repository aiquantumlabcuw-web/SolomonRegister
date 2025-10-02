import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GlobalConfig from './../../../config/GlobalConfig';
import { CSSTransition } from 'react-transition-group';
import './FailedLogin.css';

const rulesList = [
  { id: 1, label: 'Rule 1' },
  { id: 2, label: 'Rule 2' },
  { id: 3, label: 'Rule 3' },
  { id: 4, label: 'Rule 4' },
  { id: 5, label: 'Rule 5' }
];

function getRowStyle(alertLevel, isBlocked) {
  if (!isBlocked) return {}; // No color for unblocked IPs
  return { backgroundColor: '#EF9A9A', color: '#000' }; // Red for all blocked IPs
}

// Refactor getAvailableRules to use only adminRules:
const getAvailableRules = (user, adminRules) => {
  return adminRules.filter(rule => {
    if (rule.type === 'global') return true;
    if (rule.type === 'ip' && Array.isArray(rule.ips)) {
      const trimmedIPs = rule.ips.map(ip => ip.trim());
      return trimmedIPs.includes(user.ip.trim());
    }
    return false;
  });
};

// Refactor getCombinedRuleById to use only adminRules:
const getCombinedRuleById = (id, adminRules) => {
  console.log("getCombinedRuleById called with id:", id);
  const foundRule = adminRules.find(rule => Number(rule._id || rule.id) === Number(id));
  console.log("getCombinedRuleById found:", foundRule);
  return foundRule;
};

const FailedLogin = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [failedList, setFailedList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 7;
  const [newBlockDuration, setNewBlockDuration] = useState({});
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [modifyMode, setModifyMode] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [adminRules, setAdminRules] = useState([]);
  const [newRule, setNewRule] = useState({ 
    description: '', 
    threshold: '', 
    duration: '', 
    durationUnit: 'minutes', 
    action: 'block', 
    applyToAll: true, 
    notifyEmail: false,
    ips: [] 
  });
  const [selectedAdminRule, setSelectedAdminRule] = useState(null);
  
  // New states for manual IP management
  // const [manualIPs, setManualIPs] = useState([]);
  // const [manualIPInput, setManualIPInput] = useState("");
  // New state for bulk deletion selection:
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);

  const [selectedRules, setSelectedRules] = useState({});

  useEffect(() => {
    fetchFailedLogin();
    fetchRules();
    // fetchManualIPs();

    // Polling: refresh failed logins every 5 seconds
    const interval = setInterval(() => {
      fetchFailedLogin();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchFailedLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${GlobalConfig.nodeUrl}/admin/allfailedlogin`, {
        headers: { authorization: sessionStorage.getItem("token") },
      });
      
      // The API returns two separate arrays: failedAttempts and blockedUsers
      if (response.data.success) {
        const allFailedLogins = [
          ...(response.data.failedAttempts || []), 
          ...(response.data.blockedUsers || [])
        ];
        console.log("All failed logins:", allFailedLogins);
        setFailedList(allFailedLogins);
      } else {
        console.error("API returned error:", response.data);
        setFailedList([]);
      }
    } catch (error) {
      console.error('Error fetching failed logins:', error);
      setFailedList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${GlobalConfig.nodeUrl}/admin/rules`, { // Updated endpoint for persistent rules
        headers: { authorization: sessionStorage.getItem("token") },
      });
      if (response.data.success) setAdminRules(response.data.rules);
    } catch (error) {
      console.error('Error fetching admin rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // New function: fetch manual IPs from backend
  // const fetchManualIPs = async () => {
  //   try {
  //     const response = await axios.get(`${GlobalConfig.nodeUrl}/admin/manualBlockIPs`, {
  //       headers: { authorization: sessionStorage.getItem("token") },
  //     });
  //     if (response.data.success) setManualIPs(response.data.manualIPs);
  //   } catch (error) {
  //     console.error('Error fetching manual IPs:', error);
  //   }
  // };

// Dropdown rule change handler: verify, persist via PUT, update UI
const handleRuleChange = async (ip, ruleId) => {
  if (!adminRules.some(r => r._id === ruleId)) {
    console.warn('Rule not found. Please refresh.');
    return;
  }
  setIsLoading(true);
  try {
    await axios.put(
      `${GlobalConfig.nodeUrl}/ip/blocks/${ip}/rule`,
      { ruleId },
      { headers: { authorization: sessionStorage.getItem('token') } }
    );
    const matched = adminRules.find(r => r._id === ruleId);
    setFailedList(prev => prev.map(item =>
      item.ip === ip
        ? {
            ...item,
            ruleId,
            appliedRule: matched.description,
            blockExpires: matched.duration != null ? new Date(Date.now() + matched.duration) : null,
            isPermBlocked: matched.duration == null,
            alert: getAlertLevel(item.isBlocked, item.failedAttempts).level
          }
        : item
    ));
  } catch (error) {
    console.error('Error updating rule for IP:', error);
    console.warn('Rule update failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const handleUnblockUser = async (ip) => {
    setIsLoading(true);
    try {
      await axios.post(`${GlobalConfig.nodeUrl}/admin/unblock-ip`, { ip }, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      await fetchFailedLogin(); // Ensure UI updates immediately
      setSelectedRules(prev => { const copy = { ...prev }; delete copy[ip]; return copy; });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = async (ip) => {
    const ruleId = selectedRules[ip];
    if (!ruleId) {
      alert("Please select a rule first.");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${GlobalConfig.nodeUrl}/admin/apply-rule-to-ip`, { ip, ruleId }, {
        headers: { authorization: sessionStorage.getItem("token") }
      });
      await fetchFailedLogin(); // Ensure UI updates immediately
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (ip) => {
    if (!window.confirm("Are you sure you want to delete this IP record?")) return;
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${GlobalConfig.nodeUrl}/admin/clear-failed-attempts`,
        { ip },
        { headers: { authorization: sessionStorage.getItem("token") } }
      );
      if (response.data && response.data.success) {
        await fetchFailedLogin(); // Ensure UI updates immediately
        setSelectedRules(prev => { const copy = { ...prev }; delete copy[ip]; return copy; });
        alert("IP deleted successfully.");
      } else {
        alert(response.data?.msg || "Failed to delete IP record.");
      }
    } catch (error) {
      alert("Failed to delete IP record.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyUserBlockDuration = async (mac, fingerprint) => {
    if (!newBlockDuration[mac] || newBlockDuration[mac] <= 0) {
      alert("Please enter a valid duration");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${GlobalConfig.nodeUrl}/admin/modify-user-block-duration`,
        { mac, fingerprint, newDuration: newBlockDuration[mac] },
        { headers: { authorization: sessionStorage.getItem("token") }
      });
      alert(response.data.msg);
      fetchFailedLogin();
    } catch (error) {
      console.error("Error modifying block duration:", error.response ? error.response.data : error);
      alert("Failed to update block duration. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyGlobalRule = async (rule) => {
    setSelectedRule(rule);
    setDropdownVisible(false);
    
    setIsLoading(true);
    try {
      setIsApplying(true);
      const response = await axios.post(
        `${GlobalConfig.nodeUrl}/admin/apply-global-rule`,
        { ruleId: rule.id },
        { headers: { authorization: sessionStorage.getItem("token") }
      });
      
      alert(`Global rule applied: ${rule.description}`);
      fetchFailedLogin();
    } catch (error) {
      console.error("Error applying global rule:", error.response ? error.response.data : error);
      alert("Failed to apply global rule. Check console for details.");
    } finally {
      setIsApplying(false);
      setIsLoading(false);
    }
  };

  const getAlertLevel = (isBlocked, failedAttempts) => {
    if (!isBlocked) return { level: 'none', text: 'None' };
    if (failedAttempts === 3) return { level: 'medium', text: 'Medium' };
    if (failedAttempts > 3) return { level: 'high', text: 'High' };
    return { level: 'none', text: 'None' };
  };

  const getStatusText = (blockExpires, isPermBlocked, ruleId) => {
    if (isPermBlocked || ruleId === 5) return 'Permanently Blocked';
    if (blockExpires && new Date(blockExpires) > new Date()) {
      const duration = Math.ceil((new Date(blockExpires) - new Date()) / (1000 * 60));
      return `Blocked (${duration} minutes remaining)`;
    }
    return 'Active';
  };

  function formatBlockDuration(minutes) {
    if (!minutes || minutes <= 0) return 'No block';
    if (minutes < 60) return `${Math.floor(minutes)} minutes`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)} hours`;
    const days = hours / 24;
    if (days < 1) return '1 day';
    if (days < 7) return `${Math.floor(days)} days`;
    if (days < 14) return '1 week';
    if (days < 30) return '2 weeks';
    return '30 days';
  }

  const handleNewRuleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if(type === 'checkbox'){
      setNewRule(prev => ({ ...prev, [name]: checked }));
      // If "applyToAll" is checked, ensure ips are cleared.
      if(name === 'applyToAll' && checked){
        setNewRule(prev => ({ ...prev, ips: [] }));
      }
    } else if(name === 'ips'){
      setNewRule(prev => ({ ...prev, ips: value.split(',').map(s => s.trim()) }));
    } else {
      setNewRule(prev => ({ ...prev, [name]: value }));
    }
  };

  // Add new helper function to apply rule to all IPs:
const applyRuleToAll = async (rule) => {
	// This endpoint should update block statuses for any IP without an assigned rule.
	try {
		const response = await axios.post(
			`${GlobalConfig.nodeUrl}/admin/apply-global-rule`,
			{ ruleId: rule._id || rule.id },
			{ headers: { authorization: sessionStorage.getItem("token") } }
		);
		console.log("Applied rule to all IPs:", response.data);
		fetchFailedLogin();
	} catch (error) {
		console.error("Error applying rule to all IPs:", error.response ? error.response.data : error);
	}
};

// Add new helper function to apply rule to IP-specific addresses:
const applyRuleToIPs = async (rule) => {
	// This endpoint applies the rule only to the specified IPs
	// The backend is expected to update the corresponding IP table entries,
	// setting the applied rule (e.g., "Rule 3") in the status column.
	try {
		const response = await axios.post(
			`${GlobalConfig.nodeUrl}/admin/apply-ip-rule`,
			{ ruleId: rule._id || rule.id, ips: rule.ips },
			{ headers: { authorization: sessionStorage.getItem("token") }
		});
		console.log("Applied rule to selected IPs:", response.data);
		fetchFailedLogin();
	} catch (error) {
		console.error("Error applying rule to IPs:", error.response ? error.response.data : error);
	}
};

// Modify createRule to NOT call applyRuleToAll automatically:
const createRule = async () => {
	// prevent duplicate thresholds
  const thresholdNum = Number(newRule.threshold);
  // Enforce unique rule name/description (case-insensitive, trimmed)
  if (adminRules.some(r => r.description.trim().toLowerCase() === newRule.description.trim().toLowerCase())) {
    alert('A rule with this name already exists. Please choose a unique name.');
    return;
  }
  if (adminRules.some(r => Number(r.threshold) === thresholdNum)) {
    alert(`A rule for threshold ${thresholdNum} already exists.`);
    return;
  }
  // ensure duration value basic check
  if (newRule.durationUnit !== 'permanent' && (!newRule.duration || isNaN(Number(newRule.duration)) || Number(newRule.duration) <= 0)) {
    alert('Please enter a valid duration value.');
    return;
  }
  const unitMultipliers = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
  let durationMs;
  if (newRule.durationUnit === 'permanent') {
    durationMs = null;
  } else {
    durationMs = Number(newRule.duration) * unitMultipliers[newRule.durationUnit];
  }
  // enforce strictly increasing durations relative to thresholds
  for (const r of adminRules) {
    const rThresh = Number(r.threshold);
    const rDur = r.duration == null ? Number.MAX_SAFE_INTEGER : r.duration;
    const newDurVal = durationMs == null ? Number.MAX_SAFE_INTEGER : durationMs;
    if (rThresh < thresholdNum && rDur >= newDurVal) {
      alert(`Duration for threshold ${thresholdNum} must be greater than duration for threshold ${rThresh}.`);
      return;
    }
    if (rThresh > thresholdNum && rDur <= newDurVal) {
      alert(`Duration for threshold ${thresholdNum} must be less than duration for threshold ${rThresh}.`);
      return;
    }
  }
  // restrict new rules above threshold 6 if permanent rule exists at threshold 6
  if (adminRules.some(r => Number(r.threshold) === 6 && r.duration == null) && thresholdNum > 6) {
    alert('Cannot create rules above threshold 6 once a permanent rule exists for threshold 6.');
    return;
  }
  // ...existing conversion and payload...
  const payload = {
    description: newRule.description,
    threshold: thresholdNum,
    duration: durationMs,
    action: newRule.action,
    notifyEmail: newRule.notifyEmail,
    type: newRule.applyToAll ? 'global' : 'ip',
    ips: newRule.applyToAll ? [] : newRule.ips
  };
  
	setIsLoading(true);
	try {
		// Make sure we have a valid token
		const token = sessionStorage.getItem("token");
		if (!token) {
			alert("Authentication token missing. Please log in again.");
			setIsLoading(false);
			return;
		}
		
		console.log("Sending rule creation request with payload:", payload);
		console.log("Using token:", token);
		
		const response = await axios.post(
			`${GlobalConfig.nodeUrl}/admin/rules`, 
			payload, 
			{ 
				headers: { 
					authorization: token,
					'Content-Type': 'application/json'
				}
			}
		);
		
		if (response.data.success) {
			setAdminRules(prev => [...prev, response.data.rule]);
			await fetchRules(); // Bind the UI to the updated persisted rules
			// Only show a simple success alert, do not prompt to apply the rule
			alert(response.data.msg || "Rule created successfully");
			// Reset form
			setNewRule({ description: '', threshold: '', duration: '', durationUnit: 'minutes', action: 'block', applyToAll: true, notifyEmail: false, ips: [] });
		} else {
			alert("Error: " + response.data.msg);
		}
	} catch (error) {
		console.error('Error creating rule:', error);
		if (error.response) {
			console.log("Error response:", error.response.data);
			alert(`Failed to create rule: ${error.response.data.msg || error.response.statusText}`);
		} else {
			alert('Failed to create rule. Please check your input or try again.');
		}
	} finally {
		setIsLoading(false);
	}
};

// Update suspendRule function to synchronize with persistent storage and improve error feedback:
const suspendRule = async (ruleId, newStatus) => {
  setIsLoading(true);
  try {
    const response = await axios.put(`${GlobalConfig.nodeUrl}/admin/rules/${ruleId}`, { status: newStatus }, {
      headers: { authorization: sessionStorage.getItem("token") }
    });
    if (response.data.success) {
      await fetchRules(); // Re-bind by fetching the latest persisted rules
      alert(response.data.msg || "Rule status updated successfully.");
    } else {
      alert("Error: " + (response.data.msg || "Failed to update rule status."));
    }
  } catch (error) {
    console.error('Error updating rule status:', error);
    alert('Failed to update rule status due to an error.');
  } finally {
    setIsLoading(false);
  }
};

// Update deleteRule function to use persistent endpoint and proper error handling:
const deleteRule = async (ruleId) => {
  setIsLoading(true);
  try {
    const response = await axios.delete(`${GlobalConfig.nodeUrl}/admin/rules/${ruleId}`, {
      headers: { authorization: sessionStorage.getItem("token") }
    });
    if (response.data.success) {
      await fetchRules();
      await fetchFailedLogin(); // Update IP table after rule deletion
      alert(response.data.msg || "Rule deleted successfully.");
    } else {
      alert("Error: " + (response.data.msg || "Failed to delete rule."));
    }
  } catch (error) {
    console.error('Error deleting rule:', error);
    alert('Failed to delete rule due to an error.');
  } finally {
    setIsLoading(false);
  }
};

// Update modifyRule function to synchronize updates with persistent storage and handle errors:
const modifyRule = async (ruleId) => {
  if (!selectedAdminRule) return;
  if (!selectedAdminRule.description.trim()) {
    alert("Please provide a rule description.");
    return;
  }
  if (selectedAdminRule.threshold === "" || Number(selectedAdminRule.threshold) < 0) {
    alert("Threshold must be a nonnegative number.");
    return;
  }
  if (selectedAdminRule.durationValue === "" || Number(selectedAdminRule.durationValue) < 0) {
    alert("Duration must be a nonnegative number.");
    return;
  }
  const unitMultipliers = { minutes: 60000, hours: 3600000, days: 86400000 };
  const durationMs = Number(selectedAdminRule.durationValue) * (unitMultipliers[selectedAdminRule.durationUnit] || 60000);
  const updatedRule = { ...selectedAdminRule, duration: durationMs };
  setIsLoading(true);
  try {
    const response = await axios.put(
      `${GlobalConfig.nodeUrl}/admin/rules/${ruleId}`,
      updatedRule,
      { headers: { authorization: sessionStorage.getItem("token") } }
    );
    if (response.data.success) {
      await fetchRules();
      await fetchFailedLogin(); // Update IP table after rule modification
      setSelectedAdminRule(null);
      alert(response.data.msg || "Rule updated successfully.");
    } else {
      alert("Error: " + (response.data.msg || "Failed to update rule."));
    }
  } catch (error) {
    console.error("Error modifying rule:", error);
    alert("Failed to modify rule due to an error.");
  } finally {
    setIsLoading(false);
  }
};

  // New function: handle addition of a manual IP after validation
  // const handleAddManualIP = async () => {
  //   const ip = manualIPInput.trim();
  //   const ipRegex = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  //   if (!ipRegex.test(ip)) {
  //     alert("Please enter a valid IP address.");
  //     return;
  //   }
  //   try {
  //     setIsLoading(true);
  //     const response = await axios.post(
  //       `${GlobalConfig.nodeUrl}/admin/manualBlockIP`,
  //       { ip },
  //       { headers: { authorization: sessionStorage.getItem("token") }
  //     });
  //     if (response.data.success) {
  //       setManualIPs(prev => [...prev, response.data.manualIP]);
  //       setManualIPInput("");
  //       alert(response.data.msg);
  //     } else {
  //       alert("Error: " + response.data.msg);
  //     }
  //   } catch (error) {
  //     console.error("Error adding manual IP:", error);
  //     alert("Failed to manually block IP.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleUnblockManualIP = async (manualIP) => {
  //   try {
  //     setIsLoading(true);
  //     const response = await axios.post(
  //       `${GlobalConfig.nodeUrl}/admin/unblock-manual-ip`,
  //       { id: manualIP._id },
  //       { headers: { authorization: sessionStorage.getItem("token") }
  //     });
  //     if (response.data.success) {
  //       setManualIPs(manualIPs.filter(ip => ip._id !== manualIP._id));
  //       alert(response.data.msg);
  //     }
  //   } catch (error) {
  //     console.error("Error unblocking manual IP:", error);
  //     alert("Failed to unblock manual IP.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // New handler for checkbox selection:
  const handleSelectRule = (ruleId, checked) => {
    setSelectedRuleIds(prev => {
      if (checked) return [...prev, ruleId];
      return prev.filter(id => id !== ruleId);
    });
  };

  // New handler for bulk deletion:
  const handleBulkDelete = async () => {
    if (!window.confirm("Are you sure you want to delete the selected rules?")) return;
    setIsLoading(true);
    try {
      await Promise.all(selectedRuleIds.map(ruleId =>
        axios.delete(`${GlobalConfig.nodeUrl}/admin/rules/${ruleId}`, {
          headers: { authorization: sessionStorage.getItem("token") }
        })
      ));
      await fetchRules();
      setSelectedRuleIds([]);
      alert("Selected rules deleted successfully.");
    } catch (error) {
      console.error("Bulk deletion error:", error);
      alert("Failed to delete selected rules.");
    } finally {
      setIsLoading(false);
    }
  };

  // New handler for "Select All" checkbox:
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = adminRules.map(rule => rule._id);
      setSelectedRuleIds(allIds);
    } else {
      setSelectedRuleIds([]);
    }
  };

  const totalPages = Math.ceil(failedList?.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = failedList?.slice(indexOfFirstUser, indexOfLastUser);

  useEffect(() => {
    if (adminRules.length && failedList?.length) {
      setFailedList(prev => prev.map(item => {
        const matched = adminRules.find(r => Number(r.threshold) === item.failedAttempts);
        if (matched) {
          return {
            ...item,
            ruleId: matched._id,
            appliedRule: matched.description,
            blockExpires: matched.duration != null ? new Date(Date.now() + matched.duration) : item.blockExpires,
            isPermBlocked: matched.duration == null
          };
        }
        return item;
      }));
    }
  }, [adminRules]);

  return (
    <div className="m-4 p-4 border border-gray-300 rounded-3xl shadow-2xl">
      
      {/* Unified Admin Management Console */}
      <div className="admin-panel">
        <h2 className="text-xl font-bold mb-4">Admin Management Console</h2>
        <div className="create-rule p-4">
          <h3 className="text-xl font-medium mb-2">Create New Rule</h3>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              name="description"
              placeholder="Rule Name/Description"
              value={newRule.description}
              onChange={handleNewRuleChange}
              className="border p-1 rounded focus:shadow-outline"
            />
            <input
              type="number"
              name="threshold"
              placeholder="Threshold (failed attempts)"
              value={newRule.threshold}
              onChange={handleNewRuleChange}
              className="border p-1 rounded focus:shadow-outline"
            />
            <input
              type="number"
              name="duration"
              placeholder="Duration"
              value={newRule.duration}
              onChange={handleNewRuleChange}
              className="border p-1 rounded focus:shadow-outline"
            />
            <select
              name="durationUnit"
              value={newRule.durationUnit}
              onChange={handleNewRuleChange}
              className="border p-1 rounded focus:shadow-outline"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="permanent">Permanent</option>
            </select>
            <select
              name="action"
              value={newRule.action}
              onChange={handleNewRuleChange}
              className="border p-1 rounded focus:shadow-outline"
            >
              <option value="block">Block</option>
              <option value="notify">Notify</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="applyToAll"
                checked={newRule.applyToAll}
                onChange={handleNewRuleChange}
                className="form-checkbox"
              />
              <label title="This determines if the rule is global (applies to any IP) or specific to listed IPs">Make this a global rule (applies to any IP)</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="notifyEmail"
                checked={newRule.notifyEmail}
                onChange={handleNewRuleChange}
                className="form-checkbox"
              />
              <label>Send email notification when applied</label>
            </div>
            {/* If not applying to all, show the IP input */}
            {!newRule.applyToAll && (
              <input
                type="text"
                name="ips"
                placeholder="Comma-separated IPs"
                value={newRule.ips.join(', ')}
                onChange={handleNewRuleChange}
                className="border p-1 rounded focus:shadow-outline"
              />
            )}
            <button
              onClick={createRule}
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors duration-300"
            >
              Create Rule
            </button>
          </div>
        </div>
        <div className="manage-rules p-4">
          <h3 className="text-xl font-medium mb-2">Manage Rules</h3>
          {adminRules.length === 0 ? (
            <p>No admin rules created.</p>
          ) : (
            <>
              {/* Rule Actions */}
              <div className="mb-2 flex gap-2 flex-wrap">
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-150"
                  disabled={selectedRuleIds.length === 0 || isLoading}
                >
                  Delete Selected
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      {/* New Select All Checkbox */}
                      <th className="px-2 py-1 border border-gray-300 text-sm text-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={selectedRuleIds.length === adminRules.length && adminRules.length > 0}
                          onChange={e => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th className="px-2 py-1 border border-gray-300 text-sm">Rule Name</th>
                      <th className="px-2 py-1 border border-gray-300 text-sm">Threshold</th>
                      <th className="px-2 py-1 border border-gray-300 text-sm">Duration</th>
                      <th className="px-2 py-1 border border-gray-300 text-sm">Action</th>
                      <th className="px-2 py-1 border border-gray-300 text-sm">Type</th>
                      <th className="px-2 py-1 border border-gray-300 text-sm">IPs</th>
                      <th className="px-2 py-1 border border-gray-300 text-sm">Status</th>
                      <th className="px-2 py-1 border border-gray-300 text-sm">Options</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {adminRules
                      .slice() // copy to avoid mutating state
                      .sort((a, b) => Number(a.threshold) - Number(b.threshold))
                      .map(rule => (
                        <tr key={rule._id} className="text-xs">
                          {/* New Checkbox Cell */}
                          <td className="px-2 py-1 border border-gray-300 text-center">
                            <input
                              type="checkbox"
                              className="form-checkbox"
                              checked={selectedRuleIds.includes(rule._id)}
                              onChange={e => handleSelectRule(rule._id, e.target.checked)}
                            />
                          </td>
                          {/* ...existing cells for rule details and options... */}
                          {selectedAdminRule && selectedAdminRule._id === rule._id ? (
                            <>
                              <td className="px-2 py-1 border border-gray-300">
                                <input
                                  type="text"
                                  value={selectedAdminRule.description}
                                  onChange={e => setSelectedAdminRule({ ...selectedAdminRule, description: e.target.value })}
                                  className="border p-1 rounded w-full"
                                  placeholder="Rule Name/Description"
                                />
                              </td>
                              <td className="px-2 py-1 border border-gray-300">
                                <input
                                  type="number"
                                  value={selectedAdminRule.threshold}
                                  onChange={e => setSelectedAdminRule({ ...selectedAdminRule, threshold: e.target.value })}
                                  className="border p-1 rounded w-full"
                                  placeholder="Threshold"
                                />
                              </td>
                              <td className="px-2 py-1 border border-gray-300">
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={
                                      selectedAdminRule.durationValue ||
                                      (selectedAdminRule.duration ? Math.floor(selectedAdminRule.duration / 60000) : "")
                                    }
                                    onChange={e => setSelectedAdminRule({ ...selectedAdminRule, durationValue: e.target.value })}
                                    className="border p-1 rounded w-full"
                                    placeholder="Enter numeric value"
                                    title="Enter a numeric value"
                                  />
                                  <select
                                    value={selectedAdminRule.durationUnit || "minutes"}
                                    onChange={e => setSelectedAdminRule({ ...selectedAdminRule, durationUnit: e.target.value })}
                                    className="border p-1 rounded"
                                    title="Select time unit"
                                  >
                                    <option value="minutes">Minutes</option>
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                    <option value="permanent">Permanent</option> {/* Added permanent option */}
                                  </select>
                                </div>
                                {selectedAdminRule.durationValue && (
                                  <p className="text-xs text-gray-600">Preview: {selectedAdminRule.durationValue} {selectedAdminRule.durationUnit}</p>
                                )}
                              </td>
                              <td className="px-2 py-1 border border-gray-300">
                                <input
                                  type="text"
                                  value={selectedAdminRule.action}
                                  onChange={e => setSelectedAdminRule({ ...selectedAdminRule, action: e.target.value })}
                                  className="border p-1 rounded w-full"
                                  placeholder="Action"
                                />
                              </td>
                              <td className="px-2 py-1 border border-gray-300">
                                <select
                                  value={selectedAdminRule.type}
                                  onChange={e => setSelectedAdminRule({ ...selectedAdminRule, type: e.target.value, ips: e.target.value === "global" ? [] : selectedAdminRule.ips })}
                                  className="border p-1 rounded w-full"
                                >
                                  <option value="global">Global</option>
                                  <option value="ip">IP-Specific</option>
                                </select>
                              </td>
                              <td className="px-2 py-1 border border-gray-300">
                                {selectedAdminRule.type === "ip" ? (
                                  <input
                                    type="text"
                                    value={selectedAdminRule.ips.join(', ')}
                                    onChange={e => setSelectedAdminRule({ ...selectedAdminRule, ips: e.target.value.split(',').map(s => s.trim()) })}
                                    className="border p-1 rounded w-full"
                                    placeholder="Comma-separated IPs"
                                  />
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="px-2 py-1 border border-gray-300 text-center">
                                {selectedAdminRule.status || "Active"}
                              </td>
                              <td className="px-2 py-1 border border-gray-300">
                                <div className="flex gap-2">
                                  <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700 transition duration-150"
                                    onClick={() => modifyRule(rule._id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 active:bg-gray-700 transition duration-150"
                                    onClick={() => setSelectedAdminRule(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-2 py-1 border border-gray-300">{rule.description}</td>
                              <td className="px-2 py-1 border border-gray-300 text-center">{rule.threshold}</td>
                              <td className="px-2 py-1 border border-gray-300 text-center">
                                {rule.duration ? rule.duration / (60 * 1000) + " minutes" : "--"}
                              </td>
                              <td className="px-2 py-1 border border-gray-300 text-center">{rule.action}</td>
                              <td className="px-2 py-1 border border-gray-300 text-center">
                                {rule.type === "global" ? "Global" : "IP-Specific"}
                              </td>
                              <td className="px-2 py-1 border border-gray-300 text-center">
                                {rule.type === "ip" ? (rule.ips && rule.ips.length ? rule.ips.join(', ') : "--") : "N/A"}
                              </td>
                              <td className="px-2 py-1 border border-gray-300 text-center">{rule.status || "Active"}</td>
                              <td className="px-2 py-1 border border-gray-300">
                                <div className="flex gap-2">
                                  <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700 transition duration-150"
                                    onClick={() => setSelectedAdminRule(rule)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 active:bg-yellow-700 transition duration-150"
                                    onClick={() => { const newStatus = rule.status === 'suspended' ? 'active' : 'suspended'; suspendRule(rule._id, newStatus); }}
                                  >
                                    {rule.status === 'suspended' ? "Resume" : "Suspend"}
                                  </button>
                                  <button
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 active:bg-red-700 transition duration-150"
                                    onClick={() => { if (window.confirm("Are you sure you want to delete this rule?")) deleteRule(rule._id); }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Move the Manually Block IP Form here, above the IP table */}
      <div className="mb-4 flex flex-wrap gap-2 items-end bg-gray-50 p-3 rounded border border-gray-200">
        <form id="manual-block-ip-form" className="flex flex-wrap gap-2 items-end" onSubmit={async (e) => {
          e.preventDefault();
          const ip = e.target.ip.value.trim();
          const threshold = e.target.threshold.value.trim();
          const durationValue = e.target.duration.value.trim();
          const durationUnit = e.target.durationUnit.value;
          const ipRegex = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
          if (!ipRegex.test(ip)) {
            alert('Please enter a valid IPv4 address.');
            return;
          }
          if (!threshold || isNaN(Number(threshold)) || Number(threshold) < 1) {
            alert('Please enter a valid threshold.');
            return;
          }
          let durationMs = null;
          if (durationUnit !== 'permanent') {
            if (!durationValue || isNaN(Number(durationValue)) || Number(durationValue) < 1) {
              alert('Please enter a valid duration.');
              return;
            }
            const multipliers = { minutes: 60000, hours: 3600000, days: 86400000 };
            durationMs = Number(durationValue) * multipliers[durationUnit];
          }
          try {
            setIsLoading(true);
            await axios.post(`${GlobalConfig.nodeUrl}/admin/manual-block-ip`, {
              ip,
              threshold: Number(threshold),
              duration: durationUnit === 'permanent' ? null : durationMs,
              permanent: durationUnit === 'permanent'
            }, { headers: { authorization: sessionStorage.getItem("token") } });
            alert('IP manually blocked successfully.');
            await fetchFailedLogin();
            e.target.reset();
          } catch (err) {
            alert('Failed to manually block IP.');
          } finally {
            setIsLoading(false);
          }
        }}>
          <label className="font-semibold mr-2 whitespace-nowrap">Manually Block IP:</label>
          {/* Add icons inside the input fields for visual cues */}
          <div className="relative">
            <span className="absolute left-2 top-2 text-gray-400">📡</span>
            <input name="ip" type="text" placeholder="IP Address" className="border pl-8 p-1 rounded" required style={{ minWidth: 120 }} />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-2 text-gray-400">🔢</span>
            <input name="threshold" type="number" placeholder="Threshold" className="border pl-8 p-1 rounded" required style={{ minWidth: 90 }} />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-2 text-gray-400">⏱️</span>
            <input name="duration" type="number" placeholder="Duration" className="border pl-8 p-1 rounded" style={{ minWidth: 120 }} />
          </div>
          <select name="durationUnit" className="border p-1 rounded" defaultValue="minutes">
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
            <option value="permanent">Permanent</option>
          </select>
          <button type="submit" className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Block</button>
        </form>
      </div>
      {/* End Manual Block IP Form */}
      <div className="ip-panel p-4" style={{ padding: '0.5rem' }}>
        {/* Failed Login IPs Table */}
        <table className="table border-collapse border-2 border-gray-300 text-left w-full">
          <thead className="bg-gray-200 text-blue-900 text-sm">
            <tr>
              <th className="px-6 py-4 w-80 font-semibold border-b-2 border-gray-300">IP</th>
              <th className="px-6 py-4 w-28 font-semibold border-b-2 border-gray-300">Block Duration</th>
              <th className="px-4 py-4 w-48 font-semibold border-b-2 border-gray-300">Failed Attempts</th>
              <th className="px-4 py-4 w-56 font-semibold border-b-2 border-gray-300">Block Expires</th>
              <th className="px-4 py-4 w-48 font-semibold border-b-2 border-gray-300">Alert</th>
              <th className="px-4 py-4 w-48 font-semibold border-b-2 border-gray-300">Status</th>
              <th className="px-4 py-4 border-b-2 border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers
              ?.slice() // copy to avoid mutating state
              .sort((a, b) => a.ip.localeCompare(b.ip)) // sort by IP address
              .map((user, index) => {
                // Auto-match rule by failedAttempts
                const matchedRule = adminRules.find(rule => Number(rule.threshold) === user.failedAttempts);
                const availableRules = getAvailableRules(user, adminRules);
                
                // Determine alert level from various sources
                const alertObj = getAlertLevel(user.isBlocked, user.failedAttempts);
                const alertLevel = alertObj.level;
                
                // Determine status text
                const statusText = user.status || 
                    (user.isCurrentlyBlocked ? 
                    (user.blockType || 'Blocked') : 'Active');
                
                return (
                  <tr key={index} className="text-xs hover:bg-gray-50" style={getRowStyle(alertLevel, user.isBlocked)}>
                    <td className="px-6 py-4 border-b border-gray-300 truncate max-w-[120px]">{user.ip}</td>
                    {/* Block Duration cell */}
                    <td className="px-6 py-4 w-28 border-b border-gray-300">
                      {formatBlockDuration(user.remainingBlockTime)}
                    </td>
                    <td className="px-6 py-4 w-28 border-b border-gray-300">{user.isBlocked ? (user.failedAttempts || 0) : '-'}</td>
                    <td className="px-6 py-4 w-28 border-b border-gray-300">
                      {user.blockExpires ? new Date(user.blockExpires).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 border-b border-gray-300">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${alertLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                          alertLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        <span className={`w-2 h-2 mr-1 rounded-full
                          ${alertLevel === 'high' ? 'bg-orange-400' :
                            alertLevel === 'medium' ? 'bg-yellow-400' :
                            'bg-gray-400'}`}></span>
                        {alertObj.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-300">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.isCurrentlyBlocked || statusText.includes('Blocked') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {user.isBlocked ? statusText : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-gray-300">
                      <div className="flex flex-row gap-2">
                        {user.isBlocked ? (
                          <button
                            className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                            onClick={() => handleUnblockUser(user.ip)}
                            disabled={isLoading}
                          >
                            Unblock
                          </button>
                        ) : (
                          <>
                            <select
                              className="border rounded p-1 mr-2"
                              value={selectedRules[user.ip] || ''}
                              onChange={e => setSelectedRules(prev => ({ ...prev, [user.ip]: e.target.value }))}
                              disabled={isLoading}
                            >
                              <option value="" disabled>— Select Rule —</option>
                              {adminRules.map(rule => (
                                <option key={rule._id} value={rule._id}>{rule.description}</option>
                              ))}
                            </select>
                            <button
                              className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                              onClick={() => handleBlockUser(user.ip)}
                              disabled={isLoading || !selectedRules[user.ip]}
                            >
                              Block
                            </button>
                          </>
                        )}
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded"
                          onClick={() => handleDeleteUser(user.ip)}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <div className="flex gap-4 items-center justify-center mt-2">
          <button 
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        {isLoading && (
          <div className="flex items-center justify-center mt-2">
            <span className="text-sm text-blue-600">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FailedLogin;