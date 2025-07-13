import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Avatar,
    useMediaQuery
} from '@mui/material';
import { FaTrophy, FaLock, FaUser } from 'react-icons/fa';
import { useTheme } from '@mui/material/styles';

const MatchHistory = ({ matches }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Only last {matches.length} games are shown.
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 0, bgcolor: 'background.paper', maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell align="center">Players</TableCell>
                            <TableCell align="center">Type</TableCell>
                            <TableCell align="center">Points</TableCell>
                            <TableCell align="center">Duration</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {matches.map((match) => (
                            <TableRow key={match.id} hover>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{match.date}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                        {Array.from({ length: match.players }).map((_, i) => (
                                            <Avatar key={i} sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: 14 }}>P</Avatar>
                                        ))}
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <FaLock style={{ color: theme.palette.grey[500] }} />
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                        <FaTrophy style={{ color: match.outcome === 'win' ? theme.palette.success.main : theme.palette.error.main }} />
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 700, color: match.outcome === 'win' ? theme.palette.success.main : theme.palette.error.main }}
                                        >
                                            {match.points}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="body2" color="text.secondary">{match.duration}</Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MatchHistory;
