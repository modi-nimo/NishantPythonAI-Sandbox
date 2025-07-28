import React, { useState } from 'react';
import { Typography, Box, IconButton, Snackbar, Tooltip, useTheme } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Insights = ({ insights }) => {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const theme = useTheme();

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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
        <Tooltip title="Copy Insights" arrow>
          <IconButton
            onClick={handleCopy}
            size="small"
            sx={{
              ml: 1,
              color: theme.palette.text.secondary,
              backgroundColor: theme.palette.action.hover,
              '&:hover': {
                backgroundColor: theme.palette.action.selected,
              },
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {insightList.length > 0 ? (
        <Box
          sx={{
            '& p': { m: 0, mb: 1, color: theme.palette.text.secondary, lineHeight: 1.6 },
            '& ul': { m: 0, pl: 3, color: theme.palette.text.secondary },
            '& li': { mb: 0.5, color: theme.palette.text.secondary },
            '& strong': { color: theme.palette.text.primary },
            '& code': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a4a' : '#f0f0f0',
              padding: '2px 4px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            '& pre': {
              borderRadius: '8px !important',
              margin: '16px 0 !important',
              padding: '16px !important',
              backgroundColor: `${theme.palette.background.default} !important`, // Use theme's default background
              color: theme.palette.text.primary,
              fontSize: '0.9rem',
              overflowX: 'auto', // Allow horizontal scrolling for long lines
            },
          }}
        >
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                    customStyle={{
                      backgroundColor: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      borderRadius: '8px',
                      padding: '16px',
                    }}
                    wrapLines={false} // Disable wrapLines to allow horizontal scroll
                    wrapLongLines={false} // Disable wrapLongLines
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {rawMarkdown}
          </ReactMarkdown>
        </Box>
      ) : (
        <Typography color="text.secondary">No insights were generated.</Typography>
      )}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        message="Insights Copied!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Insights;
