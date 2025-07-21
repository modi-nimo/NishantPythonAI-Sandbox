import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // palette values for light mode
            primary: { main: '#1976d2' },
            background: {
              default: '#f4f6f8',
              paper: '#ffffff',
            },
          }
        : {
            // palette values for dark mode
            primary: { main: '#90caf9' },
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
          }),
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 500,
      },
    },
  });