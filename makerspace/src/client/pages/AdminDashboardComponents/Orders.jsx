import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, CircularProgress, Link } from '@mui/material';
import GlobalConfig from '../../../../config/GlobalConfig';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../assets/sharedFunctions';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getLatestTickets`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Priority</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography align="center">No tickets created in last 24 hours</Typography>
                  </TableCell>
                </TableRow>
              )}
              {orders.map(order => (
                <TableRow key={order._id}>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{order.name}</TableCell>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>{order.department}</TableCell>
                  <TableCell>{order.priority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Link color="primary" onClick={() => navigate('/allTickets')} sx={{ mt: 3, display: 'block' }}>
            See more orders
          </Link>
        </>
      )}
    </>
  );
}
