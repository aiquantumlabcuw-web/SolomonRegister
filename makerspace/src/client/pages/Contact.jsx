import Features from "../components/Features";
import Testimonials from '../components/Testimonals'
import Title from "../components/Title";
import ContactUs from "../components/ContactUs";

export default function Contact(){
    return <>
     <div className="flex flex-col items-center justify-center w-full">
      {/* Full width but still centered */}
        <ContactUs />
    </div>
    </>
}