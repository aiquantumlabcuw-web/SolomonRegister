import React from 'react';
import './AboutUs.css';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="m-11 min-h-screen bg-[#115175] flex border rounded-2xl ">
      <div className="about-us-left  p-12 text-white flex flex-col
      justify-center opacity-0  animate-text">
        <h2>INNOVATE. CREATE. PROBLEM-SOLVE</h2>
        <div className="line"></div>
        <p>
          With the largest 3-D printing capacity of any nonprofit in the state of Wisconsin, Concordia’s new Makerspace Lab is more than equipped to help your greatest innovations take shape. The Makerspace fosters creativity and entrepreneurship while aiding learning outcomes for students across all disciplines. Located on the first floor of the Robert W. Plaster Free Enterprise Center, the space supports students and community members alike by providing the real estate, resources, and instructional support for students to flex their problem-solving skills, create practical applications, or build simply for the fun of it.
        </p>
        <Link to={"/contact"}>
          <div className="learn-more-button w-full">Learn More</div>
        </Link>
        <Link to={"/signin"}>
           <div className="learn-more-button mt-4 w-full ">Create your 3d printing Ticket Now</div>
        </Link>
      </div>
      <div className="flex">
        <div className=" flex justify-center items-center relative w-96  shadow-md">
          <img className='h-5/6 p-2 object-cover absolute'  src="/Homepageimage1.jpg" alt="About Us" />
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
