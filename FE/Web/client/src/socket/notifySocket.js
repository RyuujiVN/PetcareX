import { io } from "socket.io-client";
import { getToken } from "../utils/storage/tokenStorage";

const SOCKET_URL = "http://localhost:3000/notification";

const notifySocket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnectionAttempts: 15,
  reconnectionDelay: 3000,
  reconnectionDelayMax: 15000,
  reconnection: true,
  auth: (callback) => {
    const accessToken = getToken();
    callback(accessToken ? { accessToken } : {});
  },
});

export default notifySocket;
