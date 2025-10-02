import { useSelector } from "react-redux";
import AdminDashboard from "../pages/AdminDashboardComponents/AdminDashboard";
import Slider from "../components/Slider";
 
import AboutUs from "../components/AboutUs";
import ContactUs from "../components/ContactUs";
import Chatbot from "../components/Chatbot"
import './Homepage.css';
export default function Home() {
  const isAdmin = useSelector((state) => state.admin.isAdmin);
  return (
    <>
      {isAdmin ? (
        <>
        <AdminDashboard />
        </>
      ) : ( 
        <>
        <div className="relative w-full min-h-[100svh] bg-white">
          <Slider/> 
          {/* <AboutUs/> */}
          </div>
        </>
      )}
    </>
  );
}
