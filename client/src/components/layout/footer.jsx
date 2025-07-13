import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledFooter = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(1),
  }
}));

const Footer = () => {
  const { user } = useUser();

  return (
    <StyledFooter>
      {user ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={user.picture}
            alt={user.name}
            sx={{
              width: 24,
              height: 24,
              border: '1px solid',
              borderColor: 'rgba(167, 139, 250, 0.3)'
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            Signed in as {user.name}
          </Typography>
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.875rem',
            fontWeight: 400
          }}
        >
          Guest mode • Sign in for the full experience
        </Typography>
      )}
    </StyledFooter>
  );
};

export default Footer;
