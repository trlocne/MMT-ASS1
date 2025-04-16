import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GlobalContext } from "../../context/index.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { loginUser, loginGuest, isGuestMode, setIsGuestMode } =
    useContext(GlobalContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [guestUsername, setGuestUsername] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleGuestUsernameChange = (e) => {
    setGuestUsername(e.target.value);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 3) {
      newErrors.password = "Password must be at least 3 characters";
    }

    return newErrors;
  };

  const validateGuestForm = () => {
    const newErrors = {};
    if (!guestUsername.trim()) {
      newErrors.guestUsername = "Username is required";
    } else if (guestUsername.length < 3) {
      newErrors.guestUsername = "Username must be at least 3 characters";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      const result = await loginUser(formData.email, formData.password);
      if (result.success) {
        navigate("/");
        alert("Login successful!");
      } else {
        setErrors({ email: result.message });
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateGuestForm();

    if (Object.keys(newErrors).length === 0) {
      const result = await loginGuest(guestUsername);
      if (result.success) {
        navigate("/");
        alert("Login successful!");
      } else {
        setErrors({ email: result.message });
      }
    } else {
      setErrors(newErrors);
    }
  };

  const toggleMode = () => {
    setIsGuestMode(!isGuestMode);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isGuestMode ? "Sign in as Guest" : "Sign in to your account"}
          </h2>
        </div>

        {isGuestMode ? (
          <form className="mt-8 space-y-6" onSubmit={handleGuestSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="guestUsername" className="sr-only">
                  Username
                </label>
                <input
                  id="guestUsername"
                  name="guestUsername"
                  type="text"
                  value={guestUsername}
                  onChange={handleGuestUsernameChange}
                  className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                    errors.guestUsername ? "border-red-500" : "border-gray-600"
                  } bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Enter your username"
                />
                {errors.guestUsername && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.guestUsername}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue as Guest
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                    errors.email ? "border-red-500" : "border-gray-600"
                  } bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                    errors.password ? "border-red-500" : "border-gray-600"
                  } bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm">
          <span className="text-gray-400">
            {isGuestMode
              ? "Want to sign in with your account? "
              : "Don't have an account? "}
          </span>
          {isGuestMode ? (
            <button
              onClick={toggleMode}
              className="font-medium text-indigo-400 hover:text-indigo-500"
            >
              Sign in with email
            </button>
          ) : (
            <>
              <Link
                to="/signup"
                className="font-medium text-indigo-400 hover:text-indigo-500"
              >
                Sign up
              </Link>
              <span className="text-gray-400 mx-2">or</span>
              <button
                onClick={toggleMode}
                className="font-medium text-indigo-400 hover:text-indigo-500"
              >
                Continue as Guest
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
