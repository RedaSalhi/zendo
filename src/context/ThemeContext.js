// src/context/ThemeContext.js
import React, { createContext, useState } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const theme = {
    isDark,
    colors: {
      background: isDark ? '#121212' : '#f5f0f6',
      text: isDark ? '#f5f0f6' : '#222',
      button: isDark ? '#bb86fc' : '#8e44ad',
    },
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
