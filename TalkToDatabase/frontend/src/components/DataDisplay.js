import React from 'react';
import { Typography, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const DataDisplay = ({ dataframe }) => {
  if (!dataframe || dataframe.length === 0) {
    return <Typography>No data to display.</Typography>;
  }

  const columns = Object.keys(dataframe[0]).map((key) => ({
    field: key,
    headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    flex: 1,
    minWidth: 150,
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
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
          },
        }}
      />
    </Box>
  );
};

export default DataDisplay;