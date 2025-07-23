import React, { useState } from 'react';
import { TextField, Button, Box, InputAdornment, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear'; // Import ClearIcon

const QueryInput = ({ onSubmit, loading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue);
      setInputValue(''); // Clear input after submission
    }
  };

  const handleClearInput = () => {
    setInputValue('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        label="Query your database in plain English..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={loading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {inputValue && (
                <IconButton
                  onClick={handleClearInput}
                  edge="end"
                  disabled={loading}
                  size="small"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px', // Match theme's TextField borderRadius
            paddingRight: inputValue ? '0px' : undefined,
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        endIcon={<SendIcon />}
        sx={{ height: '56px', borderRadius: '10px', minWidth: '120px' }} // Match theme's Button borderRadius
        disabled={loading || !inputValue.trim()}
      >
        Send
      </Button>
    </Box>
  );
};

export default QueryInput;
