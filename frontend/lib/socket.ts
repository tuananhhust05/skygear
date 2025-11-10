import { io, Socket } from 'socket.io-client'
import { BACKEND_URL } from './config'

let socket: Socket | null = null

export const getSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    return socket
  }
  
  socket = io(BACKEND_URL, {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

