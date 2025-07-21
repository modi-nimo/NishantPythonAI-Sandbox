import React, { useState } from 'react';
import { Typography, Box, IconButton, Snackbar } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format } from 'sql-formatter';

const SqlQueryDisplay = ({ sqlQuery, explanation }) => {
  const [openSnackbar, setOpenSnackbar] = useState(false);

  if (!sqlQuery) {
    return null;
  }

  // --- START OF ROBUST FORMATTING LOGIC ---
  let formattedSql;
  try {
    // Attempt to format using the postgresql dialect
    formattedSql = format(sqlQuery, { language: 'postgresql', tabWidth: 2 });
  } catch (error) {
    console.error("SQL formatting failed, falling back to raw query:", error);
    // If formatting fails, use the raw query to prevent crashing
    formattedSql = sqlQuery;
  }
  // --- END OF ROBUST FORMATTING LOGIC ---

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSql);
    setOpenSnackbar(true);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton
        onClick={handleCopy}
        size="small"
        sx={{ position: 'absolute', top: -12, right: 0, zIndex: 1 }}
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
      <Box sx={{ mb: 2, '& > pre': { borderRadius: '8px !important', m: 0, p: '12px !important' } }}>
        <SyntaxHighlighter
          language="sql"
          style={oneDark}
          wrapLines={true}
          wrapLongLines={true}
        >
          {formattedSql}
        </SyntaxHighlighter>
      </Box>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Explanation
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {explanation}
      </Typography>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        message="SQL Query Copied!"
      />
    </Box>
  );
};

export default SqlQueryDisplay;