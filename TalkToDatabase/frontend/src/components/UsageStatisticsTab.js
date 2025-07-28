import React from 'react';
import { Box, Typography, Paper, Grid, LinearProgress, Tooltip } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import DataObjectIcon from '@mui/icons-material/DataObject';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import BarChartIcon from '@mui/icons-material/BarChart';

const StatPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius || 12,
  boxShadow: theme.shadows[3],
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
  },
}));

const UsageStatisticsTab = ({ usageStats }) => {
  const theme = useTheme();

  // Ensure usageStats is an array of 3 numbers, defaulting to 0 if not present
  const sqlTokens = usageStats && usageStats[0] !== undefined ? usageStats[0] : 0;
  const dataframeTokens = usageStats && usageStats[1] !== undefined ? usageStats[1] : 0;
  const insightsTokens = usageStats && usageStats[2] !== undefined ? usageStats[2] : 0;

  const totalTokens = sqlTokens + dataframeTokens + insightsTokens;

  const getProgressValue = (value) => {
    return totalTokens > 0 ? (value / totalTokens) * 100 : 0;
  };

  const statsData = [
    {
      label: 'Generated SQL Query',
      value: sqlTokens,
      icon: <QueryStatsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Dataframe',
      value: dataframeTokens,
      icon: <DataObjectIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      color: theme.palette.secondary.main,
    },
    {
      label: 'Insights',
      value: insightsTokens,
      icon: <LightbulbIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />,
      color: theme.palette.info.main,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" color="text.primary" gutterBottom align="center" sx={{ mb: 4 }}>
        Usage Statistics (Tokens)
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatPaper>
              {stat.icon}
              <Typography variant="h6" color="text.primary" sx={{ mt: 2, mb: 1 }}>
                {stat.label}
              </Typography>
              <Typography variant="h5" color={stat.color} sx={{ fontWeight: 'bold', mb: 2 }}>
                {stat.value} Tokens
              </Typography>
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <LinearProgress
                  variant="determinate"
                  value={getProgressValue(stat.value)}
                  sx={{
                    flexGrow: 1,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.palette.divider,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: stat.color,
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {`${Math.round(getProgressValue(stat.value))}%`}
                </Typography>
              </Box>
            </StatPaper>
          </Grid>
        ))}
        <Grid item xs={12}>
          <StatPaper sx={{ mt: 4, p: 4, backgroundColor: theme.palette.background.default }}>
            <BarChartIcon sx={{ fontSize: 50, color: theme.palette.success.main }} />
            <Typography variant="h5" color="text.primary" sx={{ mt: 2, mb: 1 }}>
              Total Tokens Used
            </Typography>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
              {totalTokens} Tokens
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Sum of tokens from SQL Query, Dataframe, and Insights.
            </Typography>
          </StatPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UsageStatisticsTab;
