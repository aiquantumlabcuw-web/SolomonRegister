import axios from 'axios';
import TextFields from "../components/TextFields";
import Button from "../components/Button";
import { useState, useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../store/atoms/isLoggedIn";
import PasswordToggle from "../components/PasswordField";
import Tooltip from "../components/Tooltip";
import * as yup from "yup";
import { Register } from "../buttonActions/Register";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
  repeatPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Please re-enter your password"),
});

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [repeatPasswordError, setRepeatPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    specialChar: false,
  });

  const setIsLoggedInS = useSetRecoilState(isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    });
  }, [password]);
  
  // Calculate how many of the conditions are met
  const strengthCount = Object.values(passwordRequirements).filter(Boolean).length;
  
  // Determine the number of bars to fill based on strength count
  const getBarColor = (index) => {
    if (index < strengthCount) {
      if (strengthCount === 1) return 'bg-red-500'; // Very weak
      if (strengthCount === 2) return 'bg-orange-500'; // Weak
      if (strengthCount === 3 || strengthCount === 4)return 'bg-yellow-500'; // Medium
      if (strengthCount === 5) return 'bg-green-500'; // Strong
    }
    return 'bg-gray-300'; // Unmet conditions
  };

  const handleForgotPassword = async () => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      if (response.data.success) {
        setGeneralError("Password reset email sent. Please check your inbox.");
      } else {
        setGeneralError("Failed to send reset email. Please try again.");
      }
    } catch (error) {
      console.error("Forgot password request failed:", error);
      setGeneralError("An error occurred. Please try again later.");
    }
  };

  const generatePassword = async () => {
    try {
      const response = await axios.get("https://api.genratr.com", {
        params: {
          length: 12,
          uppercase: true,
          lowercase: true,
          numbers: true,
          special: true,
        }
      });

      if (response.data && response.data.password) {
        setPassword(response.data.password);
        setRepeatPassword(response.data.password);
      } else {
        setGeneralError("Failed to generate password. Please try again.");
      }
    } catch (error) {
      console.error("Password generation failed:", error);
      setGeneralError("An error occurred while generating the password.");
    }
  };

  const handleSignUp = () => {
    setEmailError("");
    setPasswordError("");
    setRepeatPasswordError("");
    setGeneralError("");

    schema
      .validate({ email, password, repeatPassword }, { abortEarly: false })
      .then(() => {
        Register(email, password, repeatPassword, setIsLoggedInS, navigate);
      })
      .catch((validationError) => {
        validationError.inner.forEach((err) => {
          if (err.path === "email") setEmailError(err.message);
          if (err.path === "password") setPasswordError(err.message);
          if (err.path === "repeatPassword") setRepeatPasswordError(err.message);
        });
      });
  };

  const unmetRequirements = [
    !passwordRequirements.minLength && 'At least 8 characters',
    !passwordRequirements.uppercase && 'One uppercase letter',
    !passwordRequirements.lowercase && 'One lowercase letter',
    !passwordRequirements.digit && 'One digit',
    !passwordRequirements.specialChar && 'One special character (!@#$%^&*()_+-=[])',
  ].filter(Boolean); // Only keep unmet requirements

  return (
    <div className="w-full min-h-[100svh] bg-white py-10 px-4 flex items-center">
      {/* Outer frame */}
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl shadow border overflow-hidden">
        {/* Left Section: Welcome Back */}
        <div className="hidden lg:flex bg-[#115175] text-white flex-col justify-center p-10">
          <h1 className="text-3xl font-bold mb-3">Welcome!</h1>
          <p className="text-base opacity-90 mb-6">Already have an account? Sign in to submit and track tickets.</p>
          <Button
            label="Sign in"
            className="bg-white text-[#115175] px-5 py-2 rounded-md hover:bg-slate-100"
            onClick={() => navigate("/signin")}
          />
        </div>

        {/* Right section: form */}
        <div className="w-full p-6 sm:p-8 md:p-10 bg-gray-50 overflow-y-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900">Create account</h2>
          <p className="text-slate-600 mb-6">Join the AI & Quantum Innovation Lab community.</p>

          <TextFields
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            label={"Email"}
            placeholder={"Enter your email"}
            className="w-full"
            error={emailError}
          />
          {emailError && <p className="text-red-500 text-sm">{emailError}</p>}

          <PasswordToggle
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            label={"Password"}
            placeholder={"Enter Password"}
            className="w-full"
            error={passwordError}
          />
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}

          <div className="flex w-4/5 space-x-2 mt-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded ${getBarColor(index)}`}
              ></div>
            ))}
          </div>

          {/* Unmet Requirements List */}
          {unmetRequirements.length > 0 && (
            <div className="text-red-500 text-sm xl:text-lg mt-1">
              <p>Missing requirements:</p>
              <ul className="ml-4 list-disc">
                {unmetRequirements.map((requirement, index) => (
                  <Tooltip key={index} message={requirement}>
                    <li>{requirement}</li>
                  </Tooltip>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-start mt-1">
            <button
              onClick={generatePassword}
              className="text-blue-500 underline text-sm xl:text-lg"
              type="button"
            >
              Generate a secure password
            </button>
          </div>
          <PasswordToggle
            onChange={(e) => setRepeatPassword(e.target.value)}
            value={repeatPassword}
            type="password"
            label={"Verify Password"}
            placeholder={"Re-enter Password"}
            className="w-full mb-4"
            error={repeatPasswordError}
          />
          {repeatPasswordError && <p className="text-red-500 text-sm">{repeatPasswordError}</p>}

          {/* Submit and Cancel Buttons */}
          <div className="flex space-x-2 mt-6">
            <button
              onClick={handleSignUp}
              className="bg-[#115175] w-28 h-10 text-base md:text-base text-white rounded-md hover:brightness-110"
            >Sign up</button>
            <button
              label={"CANCEL"}
              className="bg-slate-200 w-28 h-10 text-base md:text-base text-slate-900 rounded-md hover:bg-slate-300"
              onClick={() => navigate("/Home")}
            >CANCEL</button>
          </div>

          {generalError && <p className="text-red-500 text-sm mt-4">{generalError}</p>}
        </div>
      </div>
    </div>
  );
}