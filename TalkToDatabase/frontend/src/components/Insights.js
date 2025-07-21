import React, { useState } from 'react';
import { Typography, Box, IconButton, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReactMarkdown from 'react-markdown';

const Insights = ({ insights }) => {
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const insightList = Array.isArray(insights)
    ? insights
    : typeof insights === 'string' && insights.trim() !== ''
    ? [insights]
    : [];

  const rawMarkdown = insightList.join('\n\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMarkdown);
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
      {insightList.length > 0 ? (
        <Box
          sx={{
            '& p': { m: 0, mb: 1, color: 'text.secondary' },
            '& ul': { m: 0, pl: 3 },
            '& li': { mb: 0.5, color: 'text.secondary' },
            '& strong': { color: 'text.primary' },
          }}
        >
          <ReactMarkdown>{rawMarkdown}</ReactMarkdown>
        </Box>
      ) : (
        <Typography color="text.secondary">No insights were generated.</Typography>
      )}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        message="Insights Copied!"
      />
    </Box>
  );
};

export default Insights;