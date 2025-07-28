import React, { useState } from 'react';
import { TextField, Button, Box, InputAdornment, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear'; // Import ClearIcon

const QueryInput = ({ onSubmit, loading, lastQuestion, isInputDisabled, onClearInput }) => {
  const [inputValue, setInputValue] = useState('');

  React.useEffect(() => {
    if (!isInputDisabled) {
      setInputValue(''); // Clear input when it's re-enabled
    }
  }, [isInputDisabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue);
      // The parent component (App.js) will handle setting lastQuestion and disabling input
    }
  };

  const handleClearInput = () => {
    setInputValue('');
    onClearInput(); // Call the clear handler from the parent
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        label={isInputDisabled ? "Last Query" : "Query your database in plain English..."}
        value={isInputDisabled ? lastQuestion : inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={loading || isInputDisabled}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {(inputValue || lastQuestion) && (
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
            borderRadius: '10px',
            paddingRight: (inputValue || lastQuestion) ? '0px' : undefined,
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        endIcon={<SendIcon />}
        sx={{ height: '56px', borderRadius: '10px', minWidth: '120px' }}
        disabled={loading || !inputValue.trim() || isInputDisabled}
      >
        Send
      </Button>
    </Box>
  );
};

export default QueryInput;
