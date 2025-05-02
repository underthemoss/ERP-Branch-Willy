// SearchAndActions.tsx
import { FC } from 'react';
import {
  Box,
  Paper,
  InputBase,
  IconButton,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';

const SHORTCUT = '⌘ /';    

const ToolbarActions: FC = () => {
  return (
    <Box display="flex" gap={2} alignItems="center">
      {/* Search pill */}
      <Paper
        component="form"
        elevation={0}
        sx={{
          px: 1.5,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          width: 220,
          borderRadius: 50,
          bgcolor: (theme) => theme.palette.action.hover,
        }}
      >
        <SearchIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
        <InputBase
          placeholder="Search"
          inputProps={{ 'aria-label': 'search' }}
          sx={{
            flex: 1,
            fontSize: 14,
            '::placeholder': { color: 'text.secondary', opacity: 1 },
          }}
        />
        <Typography
          variant="caption"
          sx={{ ml: 1, color: 'text.disabled', userSelect: 'none' }}
        >
          {SHORTCUT}
        </Typography>
      </Paper>

      {/* Action icons */}
      <IconButton size="small" aria-label="notifications">
        <NotificationsNoneOutlinedIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="layout switcher">
        <ViewSidebarOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default ToolbarActions;
