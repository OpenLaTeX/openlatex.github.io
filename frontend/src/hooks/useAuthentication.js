import { useState, useEffect, useRef } from 'react';
import AuthService from '../services/AuthService';
import { UserStorage } from '../storage/UserStorage';

export const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const sessionExpiredCallbackRef = useRef(null);
  const dropdownRef = useRef(null);
  const verificationIntervalRef = useRef(null);

  const verifySession = async () => {
    if (!UserStorage.getEmail()) {
      setIsVerifying(false);
      return;
    }

    try {
      const result = await AuthService.verify();
      setIsAuthenticated(true);
      setUserEmail(result.email);
      UserStorage.saveEmail(result.email);
    } catch (err) {
      const wasLoggedIn = UserStorage.getEmail() !== '';
      setIsAuthenticated(false);
      setUserEmail('');
      UserStorage.clear();
      if (sessionExpiredCallbackRef.current && wasLoggedIn) {
        sessionExpiredCallbackRef.current();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      verificationIntervalRef.current = setInterval(() => {
        verifySession();
      }, 10 * 60 * 1000);
    }
    return () => {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const handleLogin = (email) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    UserStorage.saveEmail(email);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUserEmail('');
    setShowUserDropdown(false);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const setOnSessionExpired = (callback) => {
    sessionExpiredCallbackRef.current = callback;
  };

  return {
    isAuthenticated,
    userEmail,
    isVerifying,
    showUserDropdown,
    dropdownRef,
    handleLogin,
    handleLogout,
    toggleUserDropdown,
    setOnSessionExpired,
    verifySession
  };
};
