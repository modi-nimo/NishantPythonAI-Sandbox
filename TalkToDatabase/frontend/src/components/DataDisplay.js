import React from 'react';
import { Typography, Box, useTheme } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const DataDisplay = ({ dataframe }) => {
  const theme = useTheme();

  if (!dataframe || dataframe.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography variant="body1" color="text.secondary">
          No data to display.
        </Typography>
      </Box>
    );
  }

  const columns = Object.keys(dataframe[0]).map((key) => ({
    field: key,
    headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    flex: 1,
  }));

  const rows = dataframe.map((row, index) => ({ id: index, ...row }));

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        disableRowSelectionOnClick
        sx={{
          border: 'none',
          backgroundColor: theme.palette.background.paper,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.background.default,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-cell': {
            borderColor: theme.palette.divider,
          },
          '& .MuiDataGrid-row:nth-of-type(odd)': {
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.action.hover : theme.palette.background.paper,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: theme.palette.action.selected,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
        }}
      />
    </Box>
  );
};

export default DataDisplay;
