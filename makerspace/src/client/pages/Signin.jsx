import { useDispatch } from "react-redux";
import TextFields from "../components/TextFields";
import Button from "../components/Button";
import PasswordToggle from "../components/PasswordField";
import { LogginIn } from "../buttonActions/loggingIn";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { isLoggedIn, warning } from "../store/atoms/isLoggedIn";
import * as yup from "yup"; // Import Yup for validation
import Swal from 'sweetalert2';
import GlobalConfig from "../../../config/GlobalConfig";

// Define a validation schema using Yup
const schema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters long")
    .required("Password is required"),
});

export default function Signin() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [blockedUntil, setBlockedUntil] = useState(null);
  const setIsLoggedInS = useSetRecoilState(isLoggedIn);
  const warningS = useRecoilValue(warning);
  const setWarning = useSetRecoilState(warning);
  const navigate = useNavigate();

  // Function to handle form submission with validations
  const handleSignIn = () => {
    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setWarning("");

    // Validate the form using Yup schema
    schema
      .validate({ email, password }, { abortEarly: false })
      .then(() => {
        // If validation passes, attempt to log in
        LogginIn(email, password, setIsLoggedInS, navigate, setWarning, dispatch)
          .then((response) => {
            // Handle successful login
            if (response.success) {
              setWarning(""); // Clear warning on success
              
              // On successful login, ensure the IP is removed from the failed logins table
              fetch(`${GlobalConfig.nodeUrl}/api/clear-failed-login`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${response.token}`
                }
              })
              .then(res => res.json())
              .then(data => {
                console.log("Failed login record cleanup:", data);
              })
              .catch(err => {
                console.error("Error cleaning up failed login record:", err);
                // Continue even if this fails - it won't affect user experience
              });
            }
          })
          .catch((error) => {
            console.error('Signin error response:', error.response);
            const err = error.response;
            if (err && err.status === 429) {
              const msg = err.data.message || 'Too many failed attempts. Please wait.';
              let blockMsg = msg;
              if (err.data.until) {
                const until = new Date(err.data.until);
                const now = new Date();
                const ms = until - now;
                let timeStr = '';
                if (ms < 60 * 1000) {
                  timeStr = `${Math.floor(ms / 1000)} seconds`;
                } else if (ms < 60 * 60 * 1000) {
                  timeStr = `${Math.ceil(ms / (60 * 1000))} minutes`;
                } else if (ms < 24 * 60 * 60 * 1000) {
                  timeStr = `${Math.ceil(ms / (60 * 60 * 1000))} hours`;
                } else {
                  timeStr = `${Math.ceil(ms / (24 * 60 * 60 * 1000))} days`;
                }
                blockMsg = `Your account has been blocked. Please try again in ${timeStr}.`;
                setBlockedUntil(until);
              }
              Swal.fire({ icon: 'error', title: 'Blocked', text: blockMsg });
              setWarning(blockMsg);
              return;
            }
            else if (err && err.status === 401) {
              const attempts = err.data.attempts;
              const msg = err.data.message || `Invalid credentials. You have ${attempts} attempt${attempts !== 1 ? 's' : ''} left.`;
              Swal.fire({ icon: 'error', title: 'Login Failed', text: msg });
              setWarning(msg);
              if (typeof attempts === 'number') setPassword('');
              else if (err.data.message === 'Invalid password') setPassword('');
            }
            else if (err && err.status === 403) {
              let blockMsg = err.data.message;
              if (err.data && err.data.expires) {
                const until = new Date(err.data.expires);
                const now = new Date();
                const ms = until - now;
                let timeStr = '';
                if (ms < 60 * 1000) {
                  timeStr = `${Math.floor(ms / 1000)} seconds`;
                } else if (ms < 60 * 60 * 1000) {
                  timeStr = `${Math.ceil(ms / (60 * 1000))} minutes`;
                } else if (ms < 24 * 60 * 60 * 1000) {
                  timeStr = `${Math.ceil(ms / (60 * 60 * 1000))} hours`;
                } else {
                  timeStr = `${Math.ceil(ms / (24 * 60 * 60 * 1000))} days`;
                }
                blockMsg = `Your account has been blocked. Please try again in ${timeStr}.`;
                setBlockedUntil(until);
              }
              Swal.fire({ icon: 'error', title: 'Blocked', text: blockMsg });
              setWarning(blockMsg || 'Your account has been blocked. Please contact support.');
            }
            else {
              setWarning('Invalid email or password. Please try again.');
            }
          });
      })
      .catch((validationError) => {
        // Handle Yup validation errors
        validationError.inner.forEach((err) => {
          if (err.path === "email") setEmailError(err.message);
          if (err.path === "password") setPasswordError(err.message);
        });
      });
  };

  // New: Handle key press events; if "Enter" is pressed, attempt to sign in.
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSignIn();
    }
  };

  useEffect(() => {
    if (blockedUntil) {
      const now = new Date();
      const ms = new Date(blockedUntil) - now;
      const timer = setTimeout(() => setBlockedUntil(null), ms);
      return () => clearTimeout(timer);
    }
  }, [blockedUntil]);

  return (
    <div className="w-full min-h-[100svh] bg-white py-10 px-4 flex items-center">
      {/* Outer frame with two sections */}
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl shadow border overflow-hidden">
        {/* Left Section: Sign In */}
        <div
          className="w-full bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-center"
          onKeyDown={handleKeyDown}  // Enter key will trigger sign in
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900">Sign in</h2>
          <p className="text-slate-600 mb-6">Welcome back. Please enter your details to continue.</p>

          {/* Email Input */}
          <TextFields
          onChange={(e) => setEmail(e.target.value)}
          label={"Email"}
          value={email}
          placeholder={"Enter your email"}
          className={`w-full mb-4 ${emailError ? "border-red-500 text-left text-lg" : "border-gray-300"}`}
          error={emailError}
          />

          {emailError && <p className="text-red-500 text-sm">{emailError}</p>}

          {/* Password Input */}
          <PasswordToggle
          onChange={(e) => setPassword(e.target.value)}
          label={"Password"}
          value={password}
          placeholder={"Enter Password"}
          className={`w-full mb-4 ${passwordError ? "border-red-500 text-left text-lg" : "border-gray-300"}`}
          error={passwordError}
          />

          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}

          {/* Forgot Password */}
          <div className="flex justify-between items-center text-sm text-gray-600 mb-4 mt-2">
            <Link to="/forgotpassword" className="text-blue-600 hover:underline">Forgot your password?</Link>
          </div>

          {/* Warning Message */}
          <div className="text-red-500 mb-4">
            {warningS !== "" ? warningS : ""}
          </div>

          {blockedUntil && <p className="text-yellow-700">Your account is blocked. Please try again at {blockedUntil.toLocaleTimeString()}.</p>}

          {/* Log In Button */}
          <Button
            onClick={handleSignIn}
            label={blockedUntil ? 'Blocked' : 'Sign in'}
            className="w-full bg-[#115175] text-white py-2 rounded-md hover:brightness-110"
            disabled={!!blockedUntil}
          />
        </div>

        {/* Right Section */}
        <div className="hidden lg:flex bg-[#115175] text-white flex-col justify-center p-10">
          <h2 className="text-3xl font-bold mb-3">New to the Lab?</h2>
          <p className="text-base opacity-90 mb-6">Create an account to submit projects and track ticket progress.</p>
          <div>
            <Button
              label={"Create account"}
              className="bg-white text-[#115175] px-5 py-2 rounded-md hover:bg-slate-100"
              onClick={() => navigate("/signup")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
