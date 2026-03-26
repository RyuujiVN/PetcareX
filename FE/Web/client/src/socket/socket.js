import { io } from "socket.io-client";
import { CLIENT_AUTH_STORAGE } from "../constants/authStorage";

const SOCKET_URL = "http://localhost:3000/chat";

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  auth: (cb) => {
    const accessToken = localStorage.getItem(CLIENT_AUTH_STORAGE.tokenKey);
    cb(accessToken ? { accessToken } : {});
  },
});

export default socket;
