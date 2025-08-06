// This file must only ever be imported ONCE. Do not re-create the socket instance elsewhere!
import { io } from 'socket.io-client';
const socket = io('https://monopoly-fu9p.onrender.com/', {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
export default socket; 