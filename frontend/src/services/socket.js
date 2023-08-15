import openSocket from "socket.io-client";
import { isObject } from "lodash";

export function socketConnection(params) {
  let userId = null;
  if (localStorage.getItem("userId")) {
    userId = localStorage.getItem("userId");
  }
  return openSocket(process.env.REACT_APP_BACKEND_URL, {
    transports: ["websocket", "polling", "flashsocket"],
    pingTimeout: 100000,
    pingInterval: 100000,
    query: isObject(params) ? { ...params, userId } : { userId },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
}
