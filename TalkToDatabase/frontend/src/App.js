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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import QueryInput from './components/QueryInput';
import SqlQueryDisplay from './components/SqlQueryDisplay';
import DataDisplay from './components/DataDisplay';
import Insights from './components/Insights';
import axios from 'axios';
import { getAppTheme } from './theme';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

function App() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const theme = useMemo(() => getAppTheme(darkMode ? 'dark' : 'light'), [darkMode]);

  const handleQuerySubmit = async (userQuery) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    const minLoadingTime = 1000;
    const startTime = Date.now();
    try {
      const result = await axios.post('http://localhost:8000/query_db', { query: userQuery });
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      setResponse(result.data.response);
    } catch (err) {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      setError('An error occurred while fetching the data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSchema = async () => {
    setIsRefreshing(true);
    try {
      const result = await axios.get('http://localhost:8000/refresh_db_schema');
      // Use the actual response from the API for the notification
      setNotification({ open: true, message: result.data.response || 'Database schema refreshed successfully!', severity: 'success' });
    } catch (err) {
      // Use the detailed error message from the API if available
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Synapse
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Your Natural Language Bridge to Data
            </Typography>
          </motion.div>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* --- REPLACED ICON WITH A CLEAR BUTTON --- */}
            <Button
              variant="outlined"
              onClick={handleRefreshSchema}
              disabled={isRefreshing || loading} // Disable if refreshing or a query is running
              startIcon={isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              sx={{ textTransform: 'none' }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Schema'}
            </Button>
            <FormControlLabel
              control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
              label="Dark Mode"
            />
          </Box>
        </Box>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            {/* --- PASS isRefreshing STATE TO DISABLE INPUT --- */}
            <QueryInput onSubmit={handleQuerySubmit} loading={loading || isRefreshing} />
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
                  <LinearProgress />
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Typography color="error" align="center">
                {error}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {response && !loading && (
            <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
              <Grid container spacing={2} direction="column">
                <Grid item>
                  <motion.div variants={itemVariants}>
                    <Accordion defaultExpanded sx={{ borderRadius: 3, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Generated SQL Query</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <SqlQueryDisplay sqlQuery={response.generated_sql_query} explanation={response.explanation} />
                      </AccordionDetails>
                    </Accordion>
                  </motion.div>
                </Grid>
                <Grid item>
                  <motion.div variants={itemVariants}>
                    <Accordion defaultExpanded sx={{ borderRadius: 3, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Data</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <DataDisplay dataframe={response.dataframe} />
                      </AccordionDetails>
                    </Accordion>
                  </motion.div>
                </Grid>
                <Grid item>
                  <motion.div variants={itemVariants}>
                    <Accordion defaultExpanded sx={{ borderRadius: 3, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Insights</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Insights insights={response.insights} />
                      </AccordionDetails>
                    </Accordion>
                  </motion.div>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
        {/* --- NOTIFICATION COMPONENT FOR USER FEEDBACK --- */}
        <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }} variant="filled">
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;