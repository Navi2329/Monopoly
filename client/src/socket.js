// This file must only ever be imported ONCE. Do not re-create the socket instance elsewhere!
import { io } from 'socket.io-client';
const socket = io('http://localhost:4000', {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
export default socket; 