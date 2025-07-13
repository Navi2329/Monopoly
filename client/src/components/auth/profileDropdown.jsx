import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import {
  Avatar,
  Box,
  Typography,
  Divider,
  IconButton,
  Paper,
  Menu,
  MenuItem,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ProfileDropdown = ({ user, onLogoutClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    onLogoutClick();
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton
        onClick={handleMenuOpen}
        size="large"
        sx={{ p: 0, borderRadius: 2, border: '2px solid #a78bfa', bgcolor: 'background.paper', boxShadow: 2 }}
      >
        <Avatar src={user.picture} alt={user.name} sx={{ width: 40, height: 40 }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          component: Paper,
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 3,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 60%, #4c1d95 100%)',
            color: '#fff',
            p: 0,
            overflow: 'hidden',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, px: 2, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <Avatar src={user.picture} alt={user.name} sx={{ width: 40, height: 40, mb: 0.5 }} />
          <span style={{ fontWeight: 600, fontSize: 15, textAlign: 'center', wordBreak: 'break-word' }}>{user.name}</span>
        </Box>
        <MenuItem component={Link} to="/profile" onClick={handleMenuClose} sx={{ py: 1, gap: 1, color: '#fff', fontWeight: 600, justifyContent: 'flex-start', display: 'flex', alignItems: 'center', fontSize: 15, borderRadius: 1, mx: 1, my: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.10)' } }}>
          <FaUser style={{ color: '#a78bfa', fontSize: 16 }} />
          <span style={{ marginLeft: 8 }}>Your profile</span>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1, gap: 1, color: '#fff', fontWeight: 600, justifyContent: 'flex-start', display: 'flex', alignItems: 'center', fontSize: 15, borderRadius: 1, mx: 1, my: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.10)' } }}>
          <FaCog style={{ color: '#a78bfa', fontSize: 16 }} />
          <span style={{ marginLeft: 8 }}>Settings</span>
        </MenuItem>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.15)', my: 0.5 }} />
        <MenuItem onClick={handleLogout} sx={{ py: 1, gap: 1, color: '#f87171', fontWeight: 700, justifyContent: 'flex-start', display: 'flex', alignItems: 'center', fontSize: 15, borderRadius: 1, mx: 1, my: 0.5, '&:hover': { bgcolor: 'rgba(239,68,68,0.10)' } }}>
          <FaSignOutAlt style={{ color: '#f87171', fontSize: 16 }} />
          <span style={{ marginLeft: 8 }}>Sign out</span>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProfileDropdown;
