import React, { useState, useMemo } from 'react';
import {
  CssBaseline,
  Container,
  Grid,
  Paper,
  ThemeProvider,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Button, // Import Button
  Snackbar,
  Alert,
  CircularProgress, // Import CircularProgress for the button
  Tabs, // Import Tabs
  Tab, // Import Tab
  Drawer, // Import Drawer
  List, // Import List
  ListItem, // Import ListItem
  ListItemIcon, // Import ListItemIcon
  ListItemText, // Import ListItemText
  Divider, // Import Divider
  IconButton, // Import IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuIcon from '@mui/icons-material/Menu'; // Import MenuIcon
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Import Dark Mode Icon
import LightModeIcon from '@mui/icons-material/LightMode'; // Import Light Mode Icon
import SettingsIcon from '@mui/icons-material/Settings'; // Import Settings Icon
import HistoryIcon from '@mui/icons-material/History'; // Import History Icon
import ClearIcon from '@mui/icons-material/Clear'; // Import ClearIcon
import QueryInput from './components/QueryInput';
import SqlQueryDisplay from './components/SqlQueryDisplay';
import DataDisplay from './components/DataDisplay';
import Insights from './components/Insights';
import UsageStatsDisplay from './components/UsageStatsDisplay'; // Import UsageStatsDisplay
import UsageStatisticsTab from './components/UsageStatisticsTab'; // Import UsageStatisticsTab
import axios from 'axios';
import { getAppTheme } from './theme';
import { motion, AnimatePresence } from 'framer-motion';
import SchemaViewer from './components/SchemaViewer'; // Import SchemaViewer
import { styled } from '@mui/material/styles'; // Import styled

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4), // Increased padding
  borderRadius: theme.shape.borderRadius || 16, // Use theme's new border radius
  boxShadow: theme.shadows[6], // More pronounced shadow
  backgroundColor: theme.palette.background.paper,
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)', // More pronounced lift on hover
    boxShadow: theme.shadows[12], // Even more pronounced shadow on hover
  },
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between', // Align items to start and end
  alignItems: 'center',
  marginBottom: theme.spacing(6), // Increased margin
  paddingBottom: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
}));

const TitleBox = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column', // Stack title and subtitle vertically
  alignItems: 'flex-start', // Align title to the left
  gap: theme.spacing(1), // Reduced gap
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: '56px', // Taller tabs as per theme
  textTransform: 'none',
  fontWeight: theme.typography.fontWeightBold, // Bolder text as per theme
  fontSize: '1.1rem', // Larger font size as per theme
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: theme.typography.fontWeightBold,
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(4), // Increased margin
  backgroundColor: theme.palette.background.paper, // Use paper background for tabs
  borderRadius: theme.shape.borderRadius || 16, // Rounded corners for tabs
  boxShadow: theme.shadows[3], // Subtle shadow for tabs
  padding: theme.spacing(0, 2), // Padding inside tabs container
  '& .MuiTabs-indicator': {
    height: '5px', // Thicker indicator as per theme
    borderRadius: '5px 5px 0 0',
    backgroundColor: theme.palette.secondary.main, // Use secondary color for indicator
  },
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

function App() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [showRoadmapFeatures, setShowRoadmapFeatures] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [dbSchemaContent, setDbSchemaContent] = useState(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false); // State for controlling the drawer
  const [lastSubmittedQuestion, setLastSubmittedQuestion] = useState(''); // New state for persisting question
  const [isQueryInputDisabled, setIsQueryInputDisabled] = useState(false); // New state for disabling input

  const theme = useMemo(() => getAppTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  const handleQuerySubmit = async (userQuery) => {
    setLoading(true);
    setError(null);
    setLastSubmittedQuestion(userQuery); // Persist the question
    setIsQueryInputDisabled(true); // Disable input
    setResponse({
      user_question: userQuery,
      generated_sql_query: '',
      explanation: '',
      dataframe: null,
      insights: '',
      usage_stats: [0, 0, 0] // Initialize usage_stats
    }); // Initialize response for streaming

    try {
      const eventSource = new EventSource(`http://localhost:8000/query_db?query=${encodeURIComponent(userQuery)}`);

      eventSource.onopen = () => {
        console.log('SSE connection opened.');
        setLoading(true);
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received SSE data:', data);

        // Update the response state incrementally
        setResponse(prevResponse => {
          const newResponse = { ...prevResponse, ...data };
          // Ensure usage_stats is always an array of 3 numbers, defaulting to 0 if not present
          newResponse.usage_stats = data.usage_stats || prevResponse.usage_stats || [0, 0, 0];
          if (!Array.isArray(newResponse.usage_stats) || newResponse.usage_stats.length !== 3) {
            newResponse.usage_stats = [0, 0, 0]; // Fallback if usage_stats is malformed
          }

          // If dataframe is present and is an array, convert it to a suitable format if needed
          if (newResponse.dataframe && Array.isArray(newResponse.dataframe)) {
            // Assuming dataframe is an array of objects, no special conversion needed for display
          }
          return newResponse;
        });

        if (data.status === 'completed' || data.status === 'error') {
          eventSource.close();
          setLoading(false);
          setIsQueryInputDisabled(false); // Re-enable input after completion or error
          if (data.status === 'error') {
            setError(data.error || 'An error occurred during streaming.');
            setNotification({ open: true, message: 'Query failed. Please try again.', severity: 'error' });
          } else {
            setNotification({ open: true, message: 'Query completed successfully!', severity: 'success' });
          }
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        eventSource.close();
        setLoading(false);
        setIsQueryInputDisabled(false); // Re-enable input on error
        setError('An error occurred during streaming.');
        setNotification({ open: true, message: 'Query failed. Please try again.', severity: 'error' });
      };

    } catch (err) {
      setLoading(false);
      setIsQueryInputDisabled(false); // Re-enable input on catch
      setError('Failed to initiate streaming connection.');
      setNotification({ open: true, message: 'Query failed. Please try again.', severity: 'error' });
    }
  };

  const handleClearQueryInput = () => {
    setLastSubmittedQuestion('');
    setIsQueryInputDisabled(false);
  };

  const handleRefreshSchema = async () => {
    setIsRefreshing(true);
    try {
      const result = await axios.get('http://localhost:8000/refresh_db_schema');
      setNotification({ open: true, message: result.data.response || 'Database schema refreshed successfully!', severity: 'success' });
      setDbSchemaContent(null); // Clear schema content to force re-fetch
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to refresh database schema.';
      setNotification({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  React.useEffect(() => {
    if (showRoadmapFeatures && activeTab === 2 && !dbSchemaContent && !loadingSchema) {
      setLoadingSchema(true);
      axios.get('http://localhost:8000/database_schema')
        .then(response => {
          setDbSchemaContent(response.data);
        })
        .catch(err => {
          console.error("Failed to fetch database schema:", err);
          setNotification({ open: true, message: 'Failed to load database schema.', severity: 'error' });
        })
        .finally(() => {
          setLoadingSchema(false);
        });
    }
  }, [showRoadmapFeatures, activeTab, dbSchemaContent, loadingSchema]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <HeaderBox>
          <TitleBox initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: 'transparent',
                backgroundImage: 'linear-gradient(45deg, #BB86FC 30%, #6200EE 90%)', // Purple gradient
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)', // Subtle 3D effect
                fontWeight: 800, // Make it bolder
                fontSize: '3rem', // Make it larger
                letterSpacing: '-0.05em',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                  textShadow: '3px 3px 6px rgba(0, 0, 0, 0.4)',
                },
              }}
            >
              Synapse
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Your Natural Language Bridge to Data
            </Typography>
          </TitleBox>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={() => setDrawerOpen(true)}
            sx={{ ml: 2, color: theme.palette.text.primary }}
          >
            <MenuIcon />
          </IconButton>
        </HeaderBox>

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 280,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[6],
            },
          }}
        >
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary">Settings</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <ClearIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            <ListItem>
              <ListItemIcon>
                {darkMode ? <Brightness4Icon /> : <LightModeIcon />}
              </ListItemIcon>
              <FormControlLabel
                control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
                label="Dark Mode"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <FormControlLabel
                control={<Switch checked={showRoadmapFeatures} onChange={() => setShowRoadmapFeatures(!showRoadmapFeatures)} color="warning" />}
                label="Roadmap Features"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <RefreshIcon />
              </ListItemIcon>
              <ListItemText>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleRefreshSchema}
                  disabled={isRefreshing || loading}
                  startIcon={isRefreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                  fullWidth
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh Schema'}
                </Button>
              </ListItemText>
            </ListItem>
          </List>
        </Drawer>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledTabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)}>
              <StyledTab label="Query Interface" />
              <StyledTab label="Usage Statistics" />
              {showRoadmapFeatures && <StyledTab label="Chat History" />}
              {showRoadmapFeatures && <StyledTab label="Visualize DB Schema" />}
            </StyledTabs>

            {activeTab === 0 && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <StyledPaper sx={{ mb: 3, position: 'relative', overflow: 'hidden' }}>
                  <QueryInput
                    onSubmit={handleQuerySubmit}
                    loading={loading || isRefreshing}
                    lastQuestion={lastSubmittedQuestion}
                    isInputDisabled={isQueryInputDisabled}
                    onClearInput={handleClearQueryInput}
                  />
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }}
                      >
                        <LinearProgress color="primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </StyledPaper>

                <AnimatePresence>
                  {error && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {response && (response.generated_sql_query || response.dataframe || response.insights) && (
                    <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                      <Grid container spacing={3} direction="column">
                        {response.generated_sql_query && (
                          <Grid item xs={12}>
                            <motion.div variants={itemVariants}>
                              <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>Generated SQL Query</Typography>
                                    {response.usage_stats && response.usage_stats[0] !== undefined && (
                                      <UsageStatsDisplay label="SQL Query" count={response.usage_stats[0]} />
                                    )}
                                  </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <SqlQueryDisplay sqlQuery={response.generated_sql_query} explanation={response.explanation} />
                                </AccordionDetails>
                              </Accordion>
                            </motion.div>
                          </Grid>
                        )}
                        {response.dataframe && (
                          <Grid item xs={12}>
                            <motion.div variants={itemVariants}>
                              <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>Data</Typography>
                                    {response.usage_stats && response.usage_stats[1] !== undefined && (
                                      <UsageStatsDisplay label="Dataframe" count={response.usage_stats[1]} />
                                    )}
                                  </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <DataDisplay dataframe={response.dataframe} />
                                </AccordionDetails>
                              </Accordion>
                            </motion.div>
                          </Grid>
                        )}
                        {response.insights && (
                          <Grid item xs={12}>
                            <motion.div variants={itemVariants}>
                              <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>Insights</Typography>
                                    {response.usage_stats && response.usage_stats[2] !== undefined && (
                                      <UsageStatsDisplay label="Insights" count={response.usage_stats[2]} />
                                    )}
                                  </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Insights insights={response.insights} />
                                </AccordionDetails>
                              </Accordion>
                            </motion.div>
                          </Grid>
                        )}
                      </Grid>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 1 && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <StyledPaper>
                  <UsageStatisticsTab usageStats={response?.usage_stats} />
                </StyledPaper>
              </motion.div>
            )}

            {activeTab === 2 && showRoadmapFeatures && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <StyledPaper sx={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="h5" color="text.primary" gutterBottom>
                    Chat History
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: '600px' }}>
                    This feature is under development. Soon, you'll be able to review your past conversations and queries here. Stay tuned for updates!
                  </Typography>
                </StyledPaper>
              </motion.div>
            )}

            {activeTab === 3 && showRoadmapFeatures && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <StyledPaper>
                  <Typography variant="h5" color="text.primary" gutterBottom>
                    Database Schema
                  </Typography>
                  <Box sx={{ maxHeight: '600px', overflow: 'auto', bgcolor: 'background.default', p: 2, borderRadius: 2 }}>
                    {loadingSchema ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <CircularProgress />
                      </Box>
                    ) : dbSchemaContent ? (
                      <SchemaViewer schema={dbSchemaContent} />
                    ) : (
                      <Typography variant="body1" color="text.secondary" align="center">
                        No database schema available or failed to load. Click "Refresh Schema" to fetch it.
                      </Typography>
                    )}
                  </Box>
                </StyledPaper>
              </motion.div>
            )}
          </Grid>
        </Grid>

        <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }} variant="filled">
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
