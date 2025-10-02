import React, { useEffect, useState, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Box,
  Toolbar,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Link
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import GlobalConfig from '../../../../config/GlobalConfig';

const defaultTheme = createTheme();

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Accordion expansion states
  const [statusAccordionExpanded, setStatusAccordionExpanded] = useState(true);
  const [messagesAccordionExpanded, setMessagesAccordionExpanded] = useState(true);
  const [pendingAccordionExpanded, setPendingAccordionExpanded] = useState(true);
  const [ordersAccordionExpanded, setOrdersAccordionExpanded] = useState(true);

  // Tickets by Status chart state
  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Messages Pie Chart state (read vs unread)
  const [messageCounts, setMessageCounts] = useState({ read: 0, unread: 0 });
  const [messageChartLoading, setMessageChartLoading] = useState(true);

  // Pending Messages state
  const [pendingMessages, setPendingMessages] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // Recent Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  //-----------------------------------------------------------
  // 1. FETCH TICKET STATUS COUNTS (for Tickets By Status Pie Chart)
  //-----------------------------------------------------------
  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getCountByStatus`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch status data');
        const data = await response.json();
        console.log('Status data =>', data);
        // Map each item into label "Status (x tickets)"
        const labels = data.map(item => `${item.label} (${item.value} tickets)`);
        const values = data.map(item => item.value);
        setChartLabels(labels);
        setChartValues(values);
      } catch (error) {
        console.error('Error fetching status data:', error);
      } finally {
        setChartLoading(false);
      }
    };
    fetchStatusData();
  }, []);

  //-----------------------------------------------------------
  // 2. FETCH MESSAGES COUNT (for Messages Pie Chart)
  //-----------------------------------------------------------
  useEffect(() => {
    const fetchMessageCounts = async () => {
      try {
        const resTickets = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllTickets`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!resTickets.ok) throw new Error('Failed to fetch tickets');
        const tickets = await resTickets.json();
        let readCount = 0, unreadCount = 0;
        for (const ticket of tickets) {
          const resComments = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${ticket._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          if (resComments.ok) {
            const comments = await resComments.json();
            comments.forEach(comment => {
              if (comment.messageStatus && comment.messageStatus.admin === 'unread') {
                unreadCount++;
              } else if (comment.messageStatus && comment.messageStatus.admin === 'read') {
                readCount++;
              }
            });
          }
        }
        setMessageCounts({ read: readCount, unread: unreadCount });
      } catch (error) {
        console.error("Error fetching message counts:", error);
      } finally {
        setMessageChartLoading(false);
      }
    };
    fetchMessageCounts();
  }, []);

  //-----------------------------------------------------------
  // 3. FETCH PENDING MESSAGES (for Pending Messages Panel)
  //-----------------------------------------------------------
  useEffect(() => {
    const fetchPendingMessages = async () => {
      try {
        const resTickets = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllTickets`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!resTickets.ok) throw new Error('Failed to fetch tickets');
        const tickets = await resTickets.json();
        let pendingList = [];
        for (const ticket of tickets) {
          const resComments = await fetch(`${GlobalConfig.nodeUrl}/ticket/getAllComments?ticketId=${ticket._id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          if (resComments.ok) {
            const comments = await resComments.json();
            // A ticket is pending if there's at least one user comment unread by admin
            const pendingComments = comments.filter(
              c => c.from === 'user' && c.messageStatus && c.messageStatus.admin === 'unread'
            );
            if (pendingComments.length > 0) {
              const lastPending = pendingComments[pendingComments.length - 1];
              pendingList.push({
                ticketId: ticket._id,
                ticketCode: ticket.ticketID,
                message: lastPending.message,
                createdAt: lastPending.createdAt
              });
            }
          }
        }
        setPendingMessages(pendingList);
      } catch (error) {
        console.error("Error fetching pending messages:", error);
        setPendingMessages([]);
      } finally {
        setPendingLoading(false);
      }
    };
    fetchPendingMessages();
  }, []);

  //-----------------------------------------------------------
  // 4. FETCH RECENT ORDERS (Latest Tickets)
  //-----------------------------------------------------------
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getLatestTickets`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        // Sort by creation date descending
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sorted);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchRecentOrders();
  }, []);

  //-----------------------------------------------------------
  // PIE CHART CONFIGURATION FOR TICKETS BY STATUS
  //-----------------------------------------------------------
  const pieDataStatus = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Tickets By Status',
        data: chartValues,
        backgroundColor: [
          '#36A2EB',
          '#FF6384',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        hoverOffset: 4,
      }
    ]
  };

  // Legend positioned at the bottom
  const pieOptionsStatus = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    onClick: (event, activeElements) => {
      if (activeElements && activeElements.length > 0) {
        const index = activeElements[0].index;
        const clickedLabel = chartLabels[index] || '';
        // Remove " (x tickets)" to extract the raw status
        const status = clickedLabel.replace(/\s*\(.*$/, '');
        // Navigate to AllTickets with status filter
        navigate(`/allTickets?status=${encodeURIComponent(status)}`);
      }
    }
  };

  //-----------------------------------------------------------
  // PIE CHART CONFIGURATION FOR MESSAGES (READ VS UNREAD)
  //-----------------------------------------------------------
  const pieDataMessages = {
    labels: ['Read', 'Unread'],
    datasets: [
      {
        label: 'Messages',
        data: [messageCounts.read, messageCounts.unread],
        backgroundColor: ['#4BC0C0', '#FF6384'],
        hoverOffset: 4
      }
    ]
  };

  const pieOptionsMessages = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    onClick: (event, activeElements) => {
      if (activeElements && activeElements.length > 0) {
        const index = activeElements[0].index;
        // Index 0 -> Read, Index 1 -> Unread
        const messageStatus = index === 0 ? 'read' : 'unread';
        navigate(`/allTickets?messageStatus=${encodeURIComponent(messageStatus)}`);
      }
    }
  };

  //-----------------------------------------------------------
  // RENDER
  //-----------------------------------------------------------
  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ flexGrow: 1, p: 4, backgroundColor: defaultTheme.palette.grey[100], minHeight: '100vh' }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* Top Row: Two side-by-side pie charts */}
            <Grid item xs={12} md={6}>
              <Accordion expanded={statusAccordionExpanded} onChange={() => setStatusAccordionExpanded(!statusAccordionExpanded)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Tickets By Status</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {chartLoading ? (
                    <CircularProgress />
                  ) : chartLabels.length === 0 ? (
                    <Typography>No status data available</Typography>
                  ) : (
                    <Box sx={{ width: '100%', height: 300 }}>
                      <Pie data={pieDataStatus} options={pieOptionsStatus} />
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12} md={6}>
              <Accordion expanded={messagesAccordionExpanded} onChange={() => setMessagesAccordionExpanded(!messagesAccordionExpanded)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Messages (Read vs Unread)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {messageChartLoading ? (
                    <CircularProgress />
                  ) : (
                    <Box sx={{ width: '100%', height: 300 }}>
                      <Pie data={pieDataMessages} options={pieOptionsMessages} />
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Pending Messages Panel */}
            <Grid item xs={12}>
              <Accordion expanded={pendingAccordionExpanded} onChange={() => setPendingAccordionExpanded(!pendingAccordionExpanded)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Pending Messages</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {pendingLoading ? (
                    <CircularProgress />
                  ) : pendingMessages.length === 0 ? (
                    <Typography>No pending messages</Typography>
                  ) : (
                    <List>
                      {pendingMessages.map((msg, idx) => (
                        <React.Fragment key={`${msg.ticketId}-${idx}`}>
                          <ListItem alignItems="flex-start">
                            <ListItemText
                              primary={`Ticket: ${msg.ticketCode}`}
                              secondary={
                                <>
                                  {msg.message.length > 50
                                    ? msg.message.substring(0, 50) + '...'
                                    : msg.message}
                                  <br />
                                  {new Date(msg.createdAt).toLocaleString()}
                                </>
                              }
                            />
                            <Button variant="outlined" size="small" onClick={() => navigate(`/ticketDetailsChat/${msg.ticketId}`)}>
                              Respond
                            </Button>
                          </ListItem>
                          {idx < pendingMessages.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Recent Orders Panel */}
            <Grid item xs={12}>
              <Accordion expanded={ordersAccordionExpanded} onChange={() => setOrdersAccordionExpanded(!ordersAccordionExpanded)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Recent Orders</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {ordersLoading ? (
                    <CircularProgress />
                  ) : orders.length === 0 ? (
                    <Typography>No recent tickets found</Typography>
                  ) : (
                    <>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Department</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Priority</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order._id} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '8px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td style={{ padding: '8px' }}>{order.name || 'N/A'}</td>
                              <td style={{ padding: '8px' }}>{order.email}</td>
                              <td style={{ padding: '8px' }}>{order.department}</td>
                              <td style={{ padding: '8px' }}>{order.priority || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  <Link
                    color="primary"
                    onClick={() => navigate('/allTickets')}
                    sx={{ mt: 3, display: 'block', cursor: 'pointer' }}
                  >
                    See more orders
                  </Link>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
