import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

const UsageStatsDisplay = ({ label, count }) => {
  const theme = useTheme();

  return (
    <Tooltip title={`${label} Usage Count (Tokens)`} arrow>
      <Chip
        icon={<QueryStatsIcon />}
        label={`${label}: ${count} Tokens`}
        color="primary"
        variant="outlined"
        size="small"
        sx={{
          ml: 1,
          backgroundColor: 'transparent', // Make background transparent
          color: theme.palette.text.secondary, // Use text secondary color for better contrast
          borderColor: theme.palette.divider, // Use divider color for border
          '& .MuiChip-icon': {
            color: theme.palette.text.secondary, // Match icon color to text
          },
        }}
      />
    </Tooltip>
  );
};

export default UsageStatsDisplay;
