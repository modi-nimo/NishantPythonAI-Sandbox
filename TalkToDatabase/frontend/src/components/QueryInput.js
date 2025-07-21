import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const QueryInput = ({ onSubmit, loading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
      <TextField
        fullWidth
        variant="outlined"
        label="Query your database in plain English..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={loading}
      />
      <Button
        type="submit"
        variant="contained"
        endIcon={<SendIcon />}
        sx={{ ml: 2, height: '56px' }}
        disabled={loading}
      >
        Send
      </Button>
    </Box>
  );
};

export default QueryInput;