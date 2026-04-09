import { io } from "socket.io-client";
import { CLIENT_AUTH_STORAGE } from "../constants/authStorage";

const SOCKET_URL = "http://localhost:3000/notification";

const notifySocket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  auth: (callback) => {
    const accessToken = localStorage.getItem(CLIENT_AUTH_STORAGE.tokenKey);
    callback(accessToken ? { accessToken } : {});
  },
});

export default notifySocket;
