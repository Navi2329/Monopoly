import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Chip,
  Divider,
  alpha
} from '@mui/material';
import {
  Send,
  ChatBubbleOutline,
  VolumeOff,
  ArrowBack
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledChatContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  overflow: 'hidden'
}));

const StyledChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const StyledMessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(255, 255, 255, 0.3)',
  }
}));


const StyledUserMessageSpacer = styled('div')(({ theme }) => ({
  height: 18, // Adjust this value for more/less space
}));

const StyledMessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOwn' && prop !== 'isGame'
})(({ theme, isOwn, isGame }) => ({
  maxWidth: isGame ? '85%' : '90%',
  minWidth: 'fit-content',
  padding: theme.spacing(0.75, 1.25),
  borderRadius: isGame ? '16px' : isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  marginBottom: theme.spacing(0.5),
  background: isGame
    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.2))'
    : isOwn
      ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.12))',
  border: isGame
    ? '1px solid rgba(34, 197, 94, 0.3)'
    : isOwn
      ? 'none'
      : '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(8px)',
  animation: 'messageSlideIn 0.3s ease-out',
  '@keyframes messageSlideIn': {
    from: {
      opacity: 0,
      transform: 'translateY(10px) scale(0.95)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0) scale(1)',
    }
  }
}));

const StyledInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.3))',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  gap: theme.spacing(1.5),
  alignItems: 'flex-end'
}));

const Chat = ({ messages, onSendMessage, disabled = false, currentPlayer }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const scrollContainer = messagesContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const isOwnMessage = (sender) => {
    return sender === 'You' || sender === (currentPlayer?.name || '');
  };

  return (
    <StyledChatContainer elevation={8}>
      {/* Chat Header */}
      <StyledChatHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatBubbleOutline sx={{ color: 'rgb(59, 130, 246)', fontSize: '1.2rem' }} />
          <Typography
            variant="subtitle2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600
            }}
          >
            Chat
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.4)',
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.7)',
                background: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            <VolumeOff fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.4)',
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.7)',
                background: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
        </Box>
      </StyledChatHeader>

      {/* Messages Area */}
      <StyledMessagesContainer ref={messagesContainerRef}>
        {messages.length === 0 ? (
          null // Do not show any sample message or placeholder
        ) : (
          <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <List sx={{ py: 0, flex: 1, minHeight: 0 }}>
              {/* Find the index of the first user message */}
              {(() => {
                const firstUserMsgIdx = messages.findIndex(m => m.sender !== 'Game');
                return messages.map((msg, index) => {
                  const isOwn = isOwnMessage(msg.sender);
                  const isGameMessage = msg.sender === 'Game';
                  // Add a spacer above the first user message only
                  const isFirstUserMessage = index === firstUserMsgIdx && !isGameMessage && firstUserMsgIdx !== -1;
                  return (
                    <React.Fragment key={msg.id}>
                      {isFirstUserMessage && <StyledUserMessageSpacer />}
                      <ListItem
                        sx={{
                          px: 0,
                          py: 0.25,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isGameMessage ? 'center' : isOwn ? 'flex-end' : 'flex-start',
                          animationDelay: `${index * 30}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        {isGameMessage ? (
                          // System/Game messages - centered chip
                          <Chip
                            label={msg.text}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.2))',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: 'rgb(34, 197, 94)',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              '& .MuiChip-label': { px: 2 }
                            }}
                          />
                        ) : (
                          // User messages - bubble style
                          <Box sx={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: isOwn ? 'flex-end' : 'flex-start'
                          }}>
                            <Box sx={{ maxWidth: '95%', minWidth: 'fit-content' }}>
                              {/* Sender name (only for others) */}
                              {!isOwn && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'rgb(59, 130, 246)',
                                    fontWeight: 600,
                                    ml: 1,
                                    mb: 0.3,
                                    display: 'block',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  {msg.sender}
                                </Typography>
                              )}

                              {/* Message bubble */}
                              <StyledMessageBubble isOwn={isOwn} isGame={isGameMessage}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: isOwn ? 'white' : 'rgba(255, 255, 255, 0.95)',
                                    lineHeight: 1.3,
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '0.8rem',
                                    // Allow text to flow naturally, only wrapping when necessary
                                    hyphens: 'auto',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word'
                                  }}
                                >
                                  {msg.text}
                                </Typography>

                                {/* Timestamp */}
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    mt: 0.5,
                                    opacity: 0.6,
                                    color: isOwn ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)',
                                    fontSize: '0.65rem'
                                  }}
                                >
                                  {msg.time}
                                </Typography>
                              </StyledMessageBubble>
                            </Box>
                          </Box>
                        )}
                      </ListItem>
                    </React.Fragment>
                  );
                });
              })()}
            </List>
            <div ref={messagesEndRef} />
          </Box>
        )}
      </StyledMessagesContainer>

      {/* Message Input */}
      <StyledInputContainer>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={disabled ? "Join game to chat..." : "Type a message..."}
          disabled={disabled}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          inputProps={{ maxLength: 500 }}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              borderRadius: '25px',
              color: 'rgba(255, 255, 255, 0.9)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: '1px'
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)'
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(59, 130, 246, 0.5)',
                borderWidth: '1px'
              },
              '&.Mui-disabled': {
                opacity: 0.5
              }
            },
            '& .MuiInputBase-input': {
              padding: '12px 16px',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.4)',
                opacity: 1
              }
            }
          }}
        />
        <IconButton
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          sx={{
            width: 40,
            height: 40,
            background: message.trim() && !disabled
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'rgba(255, 255, 255, 0.08)',
            color: message.trim() && !disabled ? 'white' : 'rgba(255, 255, 255, 0.4)',
            border: message.trim() && !disabled
              ? 'none'
              : '1px solid rgba(255, 255, 255, 0.1)',
            '&:hover': {
              background: message.trim() && !disabled
                ? 'linear-gradient(135deg, #059669, #047857)'
                : 'rgba(255, 255, 255, 0.12)',
              transform: message.trim() && !disabled ? 'scale(1.05)' : 'none',
              borderColor: message.trim() && !disabled
                ? 'none'
                : 'rgba(255, 255, 255, 0.2)'
            },
            '&:active': {
              transform: message.trim() && !disabled ? 'scale(0.95)' : 'none'
            },
            '&.Mui-disabled': {
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            },
            transition: 'all 0.2s ease',
            boxShadow: message.trim() && !disabled
              ? '0 4px 12px rgba(16, 185, 129, 0.25)'
              : 'none'
          }}
        >
          <Send fontSize="small" />
        </IconButton>
      </StyledInputContainer>
    </StyledChatContainer>
  );
};

export default Chat;
