import { useState, useEffect, useRef } from 'react';
import AuthService from '../services/AuthService';
import { UserStorage } from '../storage/UserStorage';

export const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!UserStorage.getEmail());
  const [userEmail, setUserEmail] = useState(UserStorage.getEmail());
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserEmail('');
    setShowUserDropdown(false);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  return {
    isAuthenticated,
    userEmail,
    showUserDropdown,
    dropdownRef,
    handleLogin,
    handleLogout,
    toggleUserDropdown
  };
};
