import { io } from "socket.io-client";
import { getToken } from "../utils/storage/tokenStorage";

const SOCKET_URL = "http://localhost:3000/notification";

const notifySocket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  auth: (callback) => {
    const accessToken = getToken();
    callback(accessToken ? { accessToken } : {});
  },
});

export default notifySocket;
