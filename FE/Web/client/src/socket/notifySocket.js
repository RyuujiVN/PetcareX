import { io } from "socket.io-client";
import { getToken } from "../utils/storage/tokenStorage";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").trim();
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const SOCKET_URL = `${SOCKET_BASE_URL || ""}/notification`;

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
