import { io } from "socket.io-client";
import { getToken } from "../utils/storage/tokenStorage";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").trim();
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const SOCKET_URL = `${SOCKET_BASE_URL || ""}/chat`;

const chatSocket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  auth: (callback) => {
    const accessToken = getToken();
    callback(accessToken ? { accessToken } : {});
  },
});

export default chatSocket;
