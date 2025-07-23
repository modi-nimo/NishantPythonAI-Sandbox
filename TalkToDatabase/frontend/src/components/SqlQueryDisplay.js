import React, { useState } from 'react';
import { Typography, Box, IconButton, Snackbar, Tooltip } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format } from 'sql-formatter';
import { useTheme } from '@mui/material/styles'; // Import useTheme

const SqlQueryDisplay = ({ sqlQuery, explanation }) => {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const theme = useTheme(); // Access the current theme

  if (!sqlQuery) {
    return null;
  }

  let formattedSql;
  try {
    formattedSql = format(sqlQuery, { language: 'postgresql', tabWidth: 2 });
  } catch (error) {
    console.error("SQL formatting failed, falling back to raw query:", error);
    formattedSql = sqlQuery;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSql);
    setOpenSnackbar(true);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title="Copy SQL Query" arrow>
        <IconButton
          onClick={handleCopy}
          size="small"
          sx={{
            position: 'absolute',
            top: theme.spacing(1),
            right: theme.spacing(1),
            zIndex: 1,
            color: 'rgba(255, 255, 255, 0.7)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box sx={{
        mb: 2,
        '& > pre': {
          borderRadius: '8px !important',
          margin: '0 !important',
          padding: '16px !important',
          backgroundColor: 'transparent !important', // Make background transparent
          color: theme.palette.text.primary,
          fontSize: '0.9rem',
          overflowX: 'auto', // Allow horizontal scrolling for long lines
        },
      }}>
        <SyntaxHighlighter
          language="sql"
          wrapLines={false} // Disable wrapLines to allow horizontal scroll
          wrapLongLines={false} // Disable wrapLongLines
          customStyle={{
            backgroundColor: 'transparent', // Make background transparent
            color: theme.palette.text.primary,
          }}
        >
          {formattedSql}
        </SyntaxHighlighter>
      </Box>
      <Typography variant="h6" gutterBottom sx={{ mt: 3, color: theme.palette.primary.main }}>
        Explanation
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {explanation}
      </Typography>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        message="SQL Query Copied!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default SqlQueryDisplay;
