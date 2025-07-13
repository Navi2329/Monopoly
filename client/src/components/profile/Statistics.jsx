import React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';

const Statistics = ({ stats }) => (
  <Box>
    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
      Statistics
    </Typography>
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 0, bgcolor: 'background.paper', boxShadow: 0 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Box sx={{ fontSize: 32, color: 'primary.main', mb: 1 }}>{stat.icon}</Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default Statistics;
