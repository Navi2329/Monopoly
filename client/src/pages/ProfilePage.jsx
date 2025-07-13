import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import Statistics from '../components/profile/Statistics';
import Inventory from '../components/profile/Inventory';
import FriendsList from '../components/profile/FriendsList';
import MatchHistory from '../components/profile/MatchHistory';
import Header from '../components/layout/Header';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  useMediaQuery,
  Pagination
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { FaTrophy, FaGamepad, FaCalendar, FaUsers, FaStar } from 'react-icons/fa';

const mockStats = [
  { icon: <FaGamepad />, label: 'Games Played', value: 127 },
  { icon: <FaTrophy />, label: 'Games Won', value: 49 },
  { icon: <FaCalendar />, label: 'Joined', value: '1 year ago' },
  { icon: <FaUsers />, label: 'Friends', value: 6 },
];

const mockFriends = [
  { id: 1, name: 'Asap', avatar: 'https://i.pravatar.cc/40?u=asap', lastSeen: '36 minutes ago' },
  { id: 2, name: 'Arvind V Ramanan', avatar: 'https://i.pravatar.cc/40?u=arvind', lastSeen: '1 day ago' },
  { id: 3, name: 'Ob trice', avatar: 'https://i.pravatar.cc/40?u=obtrice', lastSeen: '1 day ago' },
  { id: 4, name: 'Val', avatar: 'https://i.pravatar.cc/40?u=val', lastSeen: '2 months ago' },
  { id: 5, name: 'hardcorejin', avatar: null, lastSeen: '4 months ago' },
  { id: 6, name: 'Hard Game 500$', avatar: 'https://i.pravatar.cc/40?u=hardgame', lastSeen: '5 months ago' },
];

const mockMatchHistory = Array.from({ length: 45 }, (_, i) => {
  const dates = [
    'Jul 05, 22:34', 'Jul 05, 22:25', 'Jul 04, 22:30', 'Jun 29, 22:24', 'Jun 29, 22:02',
    'Jun 29, 00:56', 'Jun 29, 00:52', 'Jun 28, 18:48', 'Jun 28, 15:23', 'Jun 27, 20:15',
    'Jun 27, 18:42', 'Jun 26, 21:30', 'Jun 26, 19:15', 'Jun 25, 22:45', 'Jun 25, 20:30'
  ];
  return {
    id: i,
    date: dates[i] || `Jun ${25 - Math.floor(i / 2)}, ${20 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    players: Math.floor(Math.random() * 4) + 2,
    outcome: Math.random() > 0.6 ? 'win' : 'loss',
    points: Math.floor(Math.random() * 400) + 50,
    duration: `${Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
  };
});

const TABS = [
  { label: 'Stats', value: 'stats' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Friends', value: 'friends' },
  { label: 'Match History', value: 'history' },
];

const ProfilePage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { user, updateUser, logoutUser } = useUser();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [tab, setTab] = useState('stats');
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 10;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleProfileUpdate = (updatedData) => {
    updateUser(updatedData);
  };

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    logoutUser();
    setShowLogoutConfirm(false);
    navigate('/');
  };

  // Pagination logic
  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = mockMatchHistory.slice(indexOfFirstGame, indexOfLastGame);
  const totalPages = Math.ceil(mockMatchHistory.length / gamesPerPage);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
      <Header onLoginSuccess={onLoginSuccess} onLogoutClick={handleLogoutClick} />
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 6 }, mt: { xs: 8, md: 10 } }}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 4 }}>
          <ProfileHeader user={user} onUpdate={handleProfileUpdate} />
        </Paper>
        <Paper elevation={2} sx={{ borderRadius: 4, mb: 4 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons={isMobile ? 'auto' : false}
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            {TABS.map((t) => (
              <Tab key={t.value} label={t.label} value={t.value} sx={{ fontWeight: 700, fontSize: '1.1rem' }} />
            ))}
          </Tabs>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            {tab === 'stats' && (
              <Statistics stats={mockStats} />
            )}
            {tab === 'inventory' && (
              <Inventory />
            )}
            {tab === 'friends' && (
              <FriendsList friends={mockFriends} />
            )}
            {tab === 'history' && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Last Games</Typography>
                <MatchHistory matches={currentGames} />
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
      <Dialog open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}>
        <DialogTitle>Sign Out</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to sign out? You'll need to log in again to access your account.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutConfirm(false)} color="primary" variant="outlined">Cancel</Button>
          <Button onClick={confirmLogout} color="primary" variant="contained">Sign Out</Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: -5 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ borderRadius: 3, fontWeight: 700, px: 5, py: 1.5, fontSize: '1.1rem', boxShadow: 2 }}
          onClick={() => navigate('/')}
        >
          Go back to Lobby
        </Button>
      </Box>
    </Box>
  );
};

export default ProfilePage;
