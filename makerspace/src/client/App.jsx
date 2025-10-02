import { useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from 'react-hot-toast';
import './App.css'
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import NavigationBar from './components/NavigationBar'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Footer from './components/Footer/Footer';
import About from './pages/About';
import Services from './pages/Services';
import PasswordChange from './pages/PasswordChange';
import Contact from './pages/Contact';
import AccountDetails from './pages/AccountDetails';
import ForgotPassword from './pages/ForgotPassword';
import EnterYourEmail from './pages/EnterEmail';
import AddPrivilege from './pages/AddPrivilege';
import ViewPrivilege from './pages/ViewPrivilege';
import LinkRolePrivilege from './pages/LinkRolePrivilege';
import Sidebar from './components/SideBar';
import Tickets from './pages/Tickets';
import AllRequests from './pages/AllTickets';
import AllUsers from './pages/AllUsers';
import EditUserDetails from './pages/EditUserDetails';
import UserPasswordChange from './pages/UserPasswordChange';
import MyRequests from './pages/MyTickets';
import { setIsAdmin } from './store/actions';
import ViewRoles from './pages/ViewRoles';
import AddRole from './pages/AddRole';
import EditUserProfile from './components/EditUserProfile';
import AdminDashboard from './pages/AdminDashboardComponents/AdminDashboard';
import ContactQuestions from './pages/ContactQuestions';
import QuestionView from './pages/QuestionView';
import TicketsDetailsChat from './pages/TicketDetailsChat';
import UserDashboard from './pages/UserDashboard';
import FAQs from './pages/FAQs'
import RouteProtection from './Validation/RouteProtection';
import RestoreBackup from './pages/RestoreBackup';
import LandingPage from './pages/LandingPage';
import Error from './pages/Error';
import LoggedInPrevent from './Validation/LoggedInPrevent';
import TicketAdminEmailer from './pages/TicketAdminEmailer';
import FailedLogin from './pages/FailedLogin';
import EmailEditor from './pages/EmailEditor';
import EmailTemplates from './pages/EmailTemplates';

function App() {
  const dispatch = useDispatch();
  const isAdmin = useSelector((state) => state.admin.isAdmin);

  useEffect(() => {
    const isAdminInfo = localStorage.getItem('userFlip') === "true";
    dispatch(setIsAdmin(isAdminInfo));
  }, []);

  return (
    <BrowserRouter>
      <RecoilRoot>
          {localStorage.getItem("userFlip") != "true" && <NavigationBar />}
        <div>
          <div style={{ display: 'flex' }}>
            {isAdmin && <Sidebar />}
            <Routes>
              <Route path='/signup' element={<LoggedInPrevent><Signup /></LoggedInPrevent>}></Route>
              <Route path='/signin' element={ <LoggedInPrevent><Signin /></LoggedInPrevent>}></Route>
              <Route path='/' element={<Home />}></Route>
              <Route path='/home' element={<Home />}></Route>
              <Route path='/about' element={<About />}></Route>
              <Route path='/contact' element={<Contact />}></Route>
              
              <Route path='/tickets' element={<RouteProtection><Tickets /></RouteProtection>}>
              
              </Route>
              <Route path='/FAQs' element={<FAQs/>}></Route>
              <Route path='/userDashboard' element={<RouteProtection><UserDashboard/></RouteProtection>}></Route> 
              <Route path='/accountdetails' element={<RouteProtection><AccountDetails /></RouteProtection>}></Route>
              <Route path='/passwordchange' element={<RouteProtection><PasswordChange /></RouteProtection>}></Route>
              <Route path='/forgotpassword' element={<ForgotPassword />}></Route>
              <Route path='/enteremail' element={<RouteProtection><EnterYourEmail /></RouteProtection>}></Route>

              <Route path='/myTickets' element={<RouteProtection><MyRequests /></RouteProtection>}></Route>
              <Route path='/allTickets' element={<RouteProtection><AllRequests /></RouteProtection>}></Route>
              <Route path='/add-privilege' element={<RouteProtection><AddPrivilege /></RouteProtection>} />
              <Route path='/view-privilege' element={<RouteProtection><ViewPrivilege /></RouteProtection>} />
              <Route path="/add-role" element={<RouteProtection><AddRole /></RouteProtection>} />
              <Route path='/view-roles' element={<RouteProtection><ViewRoles /></RouteProtection>} />
              <Route path='/link-role-privilege' element={<RouteProtection><LinkRolePrivilege /></RouteProtection>} />
              <Route path='/ticketDetailsChat/:id' element={<RouteProtection><TicketsDetailsChat /></RouteProtection>} />
              <Route path='/userpasswordchange/:id' element={<RouteProtection><UserPasswordChange /></RouteProtection>}></Route>
              <Route path='/allUsers' element={<RouteProtection><AllUsers /></RouteProtection>}></Route>
              <Route path='/editUserProfile/:id' element={<RouteProtection><EditUserProfile /></RouteProtection>}> </Route>
              <Route path='/edit-user/:id' element={<RouteProtection><EditUserDetails /></RouteProtection>}></Route>
              <Route path='/adminPanel' element={<RouteProtection><AdminDashboard /></RouteProtection>} />
              <Route path='/contactQuestions' element={<RouteProtection><ContactQuestions /></RouteProtection>} />
              <Route path='/questionView/:uniqueId' element={<RouteProtection><QuestionView /></RouteProtection>} />           
              <Route path='/backupRestore' element={<RouteProtection><RestoreBackup /></RouteProtection>} />
              <Route path='/admin-emailer' element={<RouteProtection><TicketAdminEmailer /></RouteProtection>} />
              <Route path='/failed-login' element={<RouteProtection><FailedLogin /></RouteProtection>} />
              <Route path='/email-editor' element={<RouteProtection><EmailEditor /></RouteProtection>} />
              <Route path='/admin/email-templates' element={<RouteProtection><EmailTemplates /></RouteProtection>} />
              <Route path='*' element={<Error />} />
            </Routes>
          </div>
        </div>
        <Footer />
      </RecoilRoot>

    </BrowserRouter>
  );
}
export default App
