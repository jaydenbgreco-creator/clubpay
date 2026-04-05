import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ClubContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const ClubProvider = ({ children }) => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [activeClub, setActiveClub] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClubs = useCallback(async () => {
    if (!user) {
      setClubs([]);
      setActiveClub(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/clubs`, {
        withCredentials: true
      });
      const clubList = response.data;
      setClubs(clubList);

      // Restore last selected club from localStorage or pick first
      const savedClubId = localStorage.getItem('activeClubId');
      const saved = clubList.find(c => c.id === savedClubId);
      if (saved) {
        setActiveClub(saved);
      } else if (clubList.length > 0) {
        setActiveClub(clubList[0]);
        localStorage.setItem('activeClubId', clubList[0].id);
      }
    } catch (error) {
      console.error('Failed to load clubs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const switchClub = (club) => {
    setActiveClub(club);
    localStorage.setItem('activeClubId', club.id);
  };

  const refreshClubs = () => {
    fetchClubs();
  };

  return (
    <ClubContext.Provider value={{
      clubs,
      activeClub,
      switchClub,
      refreshClubs,
      loading
    }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
