import { useState, useEffect } from "react";
import Button from "../components/Button";
import PasswordToggle from "../components/PasswordField";
import passwordChange from "../buttonActions/passwordChange";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { warning } from "../store/atoms/isLoggedIn";

export default function PasswordChange() {
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repNewPassword, setRepNewPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [rulesMet, setRulesMet] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    specialChar: false,
    noSpaces: false,
  });

  const warningS = useRecoilValue(warning);
  const setWarning = useSetRecoilState(warning);

  // Validate password rules in real-time
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

  const handleSubmit = async () => {
    setErrors({});
    await passwordChange(currPassword, newPassword, repNewPassword, setErrors);
  };

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

  return (
    <div
      className="flex justify-center items-center min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/3D-Printing.jpg')`,
        marginTop: '5vh',
        marginBottom: '5vh'
      }}
    >
      <div className="flex flex-col w-full max-w-3xl bg-white shadow-lg overflow-hidden rounded-lg p-6"
        style={{
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        <h2 className="text-4xl font-bold mb-6 text-gray-800">Change Password</h2>

        {/* Current Password Field */}
        <div className="mb-4">
          <label className="block text-2xl font-normal mb-2">Current Password:</label>
          <PasswordToggle
            onChange={(e) => setCurrPassword(e.target.value)}
            className={`w-full border ${errors.currPassword ? "border-red-500" : "border-gray-300"} rounded-lg p-2`}
          />
          {errors.currPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.currPassword}</p>
          )}
        </div>

        {/* New Password Field */}
        <div className="mb-4">
          <label className="block text-2xl font-normal mb-2">New Password:</label>
          <PasswordToggle
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full border ${errors.newPassword ? "border-red-500" : "border-gray-300"} rounded-lg p-2`}
          />
          {errors.newPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
          )}
        </div>

        {/* Password Strength Bars */}
        <div className="flex space-x-2 mt-4 w-1/2 mb-6">
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
            className={`w-full border ${errors.repNewPassword ? "border-red-500" : "border-gray-300"} rounded-lg p-2`}
          />
          {errors.repNewPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.repNewPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-6">
  <Button
    label={"Submit"}
    onClick={handleSubmit}
    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-md"
  />
</div>

        {/* Warning Message */}
        {warningS && (
          <div className="text-red-500 text-sm mt-4">
            {warningS}
          </div>
        )}
      </div>
    </div>
  );
}
