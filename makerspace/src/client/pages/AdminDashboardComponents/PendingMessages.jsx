import React, { useState, useEffect } from 'react';
import { Typography, List, ListItem, ListItemText, Button, Divider, Tooltip, CircularProgress } from '@mui/material';
import GlobalConfig from '../../../../config/GlobalConfig';
import { useNavigate } from 'react-router-dom';

export default function PendingMessages() {
  const [pendingMessages, setPendingMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        if (!resTickets.ok) {
          throw new Error('Failed to fetch tickets');
        }
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
            const pendingComments = comments.filter(c => c.from === 'user' && c.messageStatus && c.messageStatus.admin === 'unread');
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
        setLoading(false);
      }
    };

    fetchPendingMessages();
  }, []);

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Pending Messages
      </Typography>
      {loading ? (
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
                      <Tooltip title={`Full message: ${msg.message}`}>
                        <span>{msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message}</span>
                      </Tooltip>
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
    </div>
  );
}
