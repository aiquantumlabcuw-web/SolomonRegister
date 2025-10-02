import { useState, useEffect } from "react";
import PasswordToggle from "../components/PasswordField";
import Button from "../components/Button";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { warning } from "../store/atoms/isLoggedIn";
import forgotPassword from "../buttonActions/forgotPassword";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import GlobalConfig from "./../../../config/GlobalConfig";
import { useSnackbar } from "notistack";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repPassword, setRepNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rulesMet, setRulesMet] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    specialChar: false,
    noSpaces: false,
  });

  const { enqueueSnackbar } = useSnackbar();
  const warningS = useRecoilValue(warning);
  const setWarning = useSetRecoilState(warning);
  const navigate = useNavigate();

  // Validate password rules in real-time as the user types
  useEffect(() => {
    setRulesMet({
      minLength: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      digit: /\d/.test(newPassword),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
      noSpaces: !/\s/.test(newPassword),
    });
  }, [newPassword]);

  // Calculate password strength based on the number of rules met
  const strengthCount = Object.values(rulesMet).filter(Boolean).length;

  // Function to get bar color based on strength level
  const getBarColor = (index) => {
    if (index < strengthCount) {
      if (strengthCount === 1) return 'bg-red-500';
      if (strengthCount === 2) return 'bg-orange-500';
      if (strengthCount === 3 || strengthCount === 4) return 'bg-yellow-500';
      if (strengthCount >= 5) return 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  // Handle form submission
  const handleSubmit = async () => {
    setErrors({});
    await forgotPassword(email, newPassword, repPassword, setWarning, navigate);
  };
  const handleOtp = async () => {
    axios.post(`${GlobalConfig.nodeUrl}/api/verifyOtp`,{email:email,otp:otp},{
      headers:{
        "Content-Type":"application/json"
      }
    }).then((res)=>{
      console.log(res.data)
      setEmailVerified(true)
      enqueueSnackbar("OTP verified", { variant: "success" });
    }).catch((err)=>{
      console.log(err)
      enqueueSnackbar(`Error ${err.msg}`, { variant: "error" });
  })
    } 
  // Display unmet password requirements
  const unmetRequirements = Object.entries(rulesMet)
    .filter(([, met]) => !met)
    .map(([key]) => {
      switch (key) {
        case 'minLength':
          return 'At least 8 characters';
        case 'uppercase':
          return 'One uppercase letter';
        case 'lowercase':
          return 'One lowercase letter';
        case 'digit':
          return 'One digit';
        case 'specialChar':
          return 'One special character (!@#$%^&*)';
        case 'noSpaces':
          return 'No spaces allowed';
        default:
          return '';
      }
    });
  const getOtp = async () => {
    console.log(email)
    if (!email) {
      enqueueSnackbar("Email is required", { variant: "error" });
      return;
    }
    await axios.post(`${GlobalConfig.nodeUrl}/api/getOtp`,{email:email},{
      headers:{
        "Content-Type":"application/json"
      }
    }).then((res)=>{
      enqueueSnackbar("OTP sent to your email", { variant: "success" });
      console.log(res.data)
    }).catch((err)=>{
      if(err.status === 404)
      enqueueSnackbar(`User with this email not found`, { variant: "error" })
    })
  
  }
  return (
    <div 
      className="flex justify-center items-center min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('3D-Printing.jpg')` }}
    >
      {/* Container with scrollable content */}
      <div className="flex flex-col w-full max-w-3xl bg-white shadow-lg overflow-hidden rounded-lg p-6 gap-4"
        style={{
          maxHeight: '80vh', // Limit the height of the container
          marginTop: '5vh',
          marginBottom: '5vh',
          overflowY: 'auto' // Add scroll bar when content overflows
        }}
      >
        <div className="w-full">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Forgot Password</h2>

          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-2xl font-normal mb-2">Email</label> 
            <input
        type="email"
        value={email}
        placeholder="Give your email here"
        onChange={(e) => setEmail(e.target.value)}
        className={`rounded-lg p-2`}
        style={{
          width: "53%",
          border: "2px solid gray", // Default border color
          outline: "none", // Removes default focus outline
        }}
        onFocus={(e) => (e.target.style.borderColor = "#1F2937")} 
        onBlur={(e) => (e.target.style.borderColor = "#gray")} // Revert border color on blur
      />
             <Button
            onClick={getOtp}
            label={"Send OTP"}
            className="bbg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-m"
          />
          </div>
          <div className="mb-4">
            { (emailVerified) ?<> {/* password and pwd confirm */}
          <div className="mb-4">
            {/* New Password Field */}
          <div className="mb-4">
            <label className="block text-2xl font-normal mb-2">New Password</label>
            <PasswordToggle
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full border ${errors.newPassword ? "border-red-500" : "border-gray-300"} rounded-m p-2`}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Password Strength Bars */}
          <div className="flex space-x-2 mt-4 w-3/4 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-2 w-full rounded ${getBarColor(index)}`}
                style={{ maxWidth: '20%' }}
              ></div>
            ))}
          </div>

          {/* Display Unmet Requirements */}
          {unmetRequirements.length > 0 && (
            <div className="text-red-500 text-sm mt-2">
              <p>Missing requirements:</p>
              <ul className="ml-4 list-disc">
                {unmetRequirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirm New Password Field */}
          <div className="mt-6 mb-4">
            <label className="block text-2xl font-normal mb-2">Confirm New Password:</label>
            <PasswordToggle
              onChange={(e) => setRepNewPassword(e.target.value)}
              className={`w-full border ${errors.repPassword ? "border-red-500" : "border-gray-300"} rounded-lg p-2`}
            />
            {errors.repPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.repPassword}</p>
            )}
          </div>

          {/* Warning Message */}
          {warningS && (
            <div className="text-red-500 text-sm mb-4">
              {warningS}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            label={"Submit"}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          />
            </div></> : <> <div className="mb-4">
            <label className="block text-2xl font-normal mb-2">Enter OTP</label>
            <input
              type="number"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`w-border rounded-lg p-2`}
              style={{
                width: "53%",
                border: "2px solid gray", // Default border color
                outline: "none", // Removes default focus outline
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1F2937")} 
              onBlur={(e) => (e.target.style.borderColor = "#gray")} // Revert border color on blur
            />
          </div>
          <Button
            onClick={handleOtp}
            label={"Submit OTP"}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          /></>}
         
          </div>
       
        </div>
      </div>
    </div>
  );
}
