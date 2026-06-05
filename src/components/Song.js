import React from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Metronome from './Metronome';

const Song = ({ song, onEdit, onDelete }) => {
  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
      <CardContent>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box>
            <Typography variant="h5" component="h2">
              {song.title}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {song.artist}
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={() => onEdit(song)} size="small">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => onDelete(song)} size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        {song.bpm && (
          <Box sx={{ mb: 2 }}>
            <Metronome bpm={parseInt(song.bpm)} />
          </Box>
        )}

        {song.lyrics && (
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              mt: 2,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
            }}
          >
            {song.lyrics}
          </Typography>
        )}

        {song.notes && (
          <Typography color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
            {song.notes}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default Song;
