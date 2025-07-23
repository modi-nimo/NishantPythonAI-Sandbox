import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // palette values for light mode
            primary: { main: '#673ab7' }, // Deep Purple
            secondary: { main: '#ffc107' }, // Amber
            background: {
              default: '#f0f2f5', // Light Grayish Blue
              paper: '#ffffff',
            },
            text: {
              primary: '#333333',
              secondary: '#555555',
            },
          }
        : {
            // palette values for dark mode (more sophisticated)
            primary: { main: '#BB86FC' }, // Vibrant Purple
            secondary: { main: '#03DAC6' }, // Teal
            background: {
              default: '#121212', // Very dark background
              paper: '#1E1E1E', // Slightly lighter paper background
            },
            text: {
              primary: '#E0E0E0', // Light gray for primary text
              secondary: '#B0B0B0', // Medium gray for secondary text
            },
            error: { main: '#CF6679' }, // Red for errors
            warning: { main: '#FFCC80' }, // Orange for warnings
            info: { main: '#80DEEA' }, // Cyan for info
            success: { main: '#A5D6A7' }, // Green for success
          }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        fontSize: '2.5rem', // Slightly larger
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
        fontSize: '2rem', // Slightly larger
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      subtitle1: {
        fontSize: '1.2rem', // Slightly larger
        color: mode === 'dark' ? '#B0B0B0' : '#555555', // Ensure good contrast
      },
      body1: {
        fontSize: '1.05rem', // Slightly larger
      },
      body2: {
        fontSize: '0.95rem', // Slightly larger
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease-in-out',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0px 6px 30px rgba(0, 0, 0, 0.1)', // More pronounced shadow
            borderRadius: '16px', // More rounded corners
            transition: 'box-shadow 0.3s ease-in-out',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '10px', // More rounded buttons
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 20px',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px', // More rounded text fields
              backgroundColor: mode === 'dark' ? '#2A2A2A' : '#F5F5F5',
              '& fieldset': {
                borderColor: mode === 'dark' ? '#424242' : '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: mode === 'dark' ? '#BB86FC' : '#673ab7',
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'dark' ? '#BB86FC' : '#673ab7',
                borderWidth: '2px',
              },
            },
            '& .MuiInputLabel-root': {
              color: mode === 'dark' ? '#B0B0B0' : '#757575',
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: '16px !important', // More rounded accordions
            '&:before': {
              display: 'none',
            },
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.05)',
            backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
            transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            padding: '16px 24px',
            '&.Mui-expanded': {
              minHeight: '48px',
            },
          },
          content: {
            margin: '12px 0',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: '16px 24px 24px',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: '56px', // Taller tabs
            backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.05)',
            padding: '0 16px',
          },
          indicator: {
            height: '5px', // Thicker indicator
            borderRadius: '5px 5px 0 0',
            backgroundColor: mode === 'dark' ? '#03DAC6' : '#673ab7', // Teal for dark, purple for light
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700, // Bolder text
            fontSize: '1.1rem', // Larger font size
            minHeight: '56px',
            padding: '12px 20px',
            color: mode === 'dark' ? '#B0B0B0' : '#757575',
            '&.Mui-selected': {
              color: mode === 'dark' ? '#E0E0E0' : '#333333',
            },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
            borderRadius: '12px',
            backgroundColor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: mode === 'dark' ? '#2A2A2A' : '#F0F2F5',
              color: mode === 'dark' ? '#E0E0E0' : '#333',
              fontWeight: 700,
              borderBottom: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            color: mode === 'dark' ? '#B0B0B0' : '#9E9E9E',
            '&.Mui-checked': {
              color: mode === 'dark' ? '#03DAC6' : '#673ab7',
            },
            '&.Mui-checked + .MuiSwitch-track': {
              backgroundColor: mode === 'dark' ? '#03DAC6' : '#673ab7',
            },
          },
          track: {
            backgroundColor: mode === 'dark' ? '#424242' : '#BDBDBD',
          },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 500,
          },
        },
      },
    },
  });
