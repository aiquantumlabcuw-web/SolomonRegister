import * as React from 'react';
import { useEffect, useState } from 'react'; 
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ClipLoader from 'react-spinners/ClipLoader';
import { formatDate } from '../../assets/sharedFunctions';
import { useNavigate } from 'react-router-dom';
import GlobalConfig from '../../../../config/GlobalConfig';
// import Title from './Title';

// Generate Order Data


function preventDefault(event) {
  event.preventDefault();
  
}

export default function Orders() {
    const navigate = useNavigate();
    function createData(id, date, name, email, department, priority) {
        return { id, date, name, email, department, priority };
      }
      const [list, setList] = useState([]);
      const [loading, setLoading] = useState(true);
      useEffect(() => {
        const fetchTickets = async () => {
          try {
             
              const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getMyLatestTickets`,{
                method: 'GET',
                headers: {
                  authorization: `Bearer ${sessionStorage.getItem('token')}`, 
                  'Content-Type': 'application/json'
                }
              });
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              const data = await response.json();
              setList(data.sort((a, b) => (a.status === 'Closed' ? 1 : -1)));
          } catch (error) {
              console.log(error);
          } finally {
              setLoading(false);
             console.log('list',list)
          }
      }
      fetchTickets()

    }, []);
  return (
    <React.Fragment>
      {loading ? (
                    <ClipLoader color="#080f9c" loading={loading} size={50} />
                ) :(<>
      <legend>Your Tickets Created in Last 24 hours</legend>
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
          {list.length < 1 ? <TableRow>
            <TableCell colSpan={5}> <p className="mx-auto">No tickets created in last 24 hours</p></TableCell>
          </TableRow> : null}
          {list.map((row) => (
            <TableRow key={list.id}>
              <TableCell>{formatDate(row.createdAt)}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{`${row.priority}`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Link color="primary" onClick={()=>{preventDefault; navigate('/allTickets')}} sx={{ mt: 3 }}>
        See more orders
      </Link></>)}
    </React.Fragment>
  );
}