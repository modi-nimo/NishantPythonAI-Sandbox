import React from 'react';
import { Box, Typography, IconButton, Collapse, Paper, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TableChartIcon from '@mui/icons-material/TableChart';
import ColumnIcon from '@mui/icons-material/ViewColumn';

const SchemaItem = ({ name, value, depth = 0 }) => {
  const [open, setOpen] = React.useState(true);
  const theme = useTheme();

  const handleToggle = () => {
    setOpen(!open);
  };

  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);

  let icon = null;
  let labelColor = 'text.primary';
  let labelVariant = 'body1';

  if (depth === 0) {
    icon = <TableChartIcon sx={{ color: theme.palette.primary.main }} />;
    labelVariant = 'h6';
    labelColor = 'primary';
  } else if (isObject && !isArray) {
    icon = <ColumnIcon sx={{ color: theme.palette.secondary.main }} />;
    labelVariant = 'subtitle1';
  } else if (name.includes('column_name') || name.includes('data_type')) {
    labelColor = 'text.secondary';
    labelVariant = 'body2';
  }

  const label = isObject
    ? `${name} ${isArray ? `[${value.length}]` : '{}'}`
    : `${name}: ${String(value)}`;

  const hasChildren = isObject && (isArray ? value.length > 0 : Object.keys(value).length > 0);

  return (
    <Box sx={{
      pl: depth * 2,
      borderLeft: depth > 0 ? `1px solid ${theme.palette.divider}` : 'none',
      ml: depth > 0 ? '8px' : '0px',
      py: 0.5,
    }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: hasChildren ? 'pointer' : 'default',
          py: 0.5,
          '&:hover': {
            backgroundColor: hasChildren ? theme.palette.action.hover : 'transparent',
            borderRadius: '4px',
          },
        }}
        onClick={hasChildren ? handleToggle : undefined}
      >
        {hasChildren && (
          <IconButton size="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }}>
            {open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
        {icon && <Box sx={{ mr: 1 }}>{icon}</Box>}
        <Typography variant={labelVariant} color={labelColor} sx={{ fontWeight: depth === 0 ? 'bold' : 'normal' }}>
          {label}
        </Typography>
      </Box>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 2 }}>
            {isArray
              ? value.map((item, index) => (
                  <SchemaItem key={index} name={`[${index}]`} value={item} depth={depth + 1} />
                ))
              : Object.entries(value).map(([key, val]) => (
                  <SchemaItem key={key} name={key} value={val} depth={depth + 1} />
                ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const SchemaViewer = ({ schema }) => {
  const theme = useTheme();

  if (!schema) {
    return <Typography variant="body1" color="text.secondary" align="center">No schema to display.</Typography>;
  }

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.background.paper, borderRadius: 2, maxHeight: '600px', overflowY: 'auto', border: `1px solid ${theme.palette.divider}` }}>
      {Object.entries(schema).map(([key, value]) => (
        <SchemaItem key={key} name={key} value={value} depth={0} />
      ))}
    </Paper>
  );
};

export default SchemaViewer;
