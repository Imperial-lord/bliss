/**
 * In-memory room and peer registry for WebRTC signaling.
 */
class RoomManager {
  constructor() {
    // roomId -> Map<socketId, peerData>
    this.rooms = new Map();
    // socketId -> Set<roomId>
    this.socketToRooms = new Map();
  }

  joinRoom(roomId, socketId, peerData) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }

    const room = this.rooms.get(roomId);
    const existing = room.get(socketId) || {};
    const peer = {
      socketId,
      userName: peerData.userName || `User_${socketId.substring(0, 4)}`,
      avatarId: peerData.avatarId || 'cyber-rebel',
      audioEnabled: peerData.audioEnabled ?? true,
      videoEnabled: peerData.videoEnabled ?? true,
      joinedAt: Date.now(),
      ...existing,
      ...peerData
    };

    room.set(socketId, peer);

    if (!this.socketToRooms.has(socketId)) {
      this.socketToRooms.set(socketId, new Set());
    }
    this.socketToRooms.get(socketId).add(roomId);

    return peer;
  }

  getPeersInRoom(roomId, excludeSocketId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const peers = [];
    for (const [sId, peer] of room.entries()) {
      if (!excludeSocketId || sId !== excludeSocketId) {
        peers.push(peer);
      }
    }
    return peers;
  }

  getPeer(roomId, socketId) {
    const room = this.rooms.get(roomId);
    return room ? room.get(socketId) : null;
  }

  updatePeerMedia(roomId, socketId, { audioEnabled, videoEnabled }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const peer = room.get(socketId);
    if (!peer) return null;

    if (audioEnabled !== undefined) peer.audioEnabled = audioEnabled;
    if (videoEnabled !== undefined) peer.videoEnabled = videoEnabled;

    return peer;
  }

  leaveRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const peer = room.get(socketId);
    room.delete(socketId);

    if (room.size === 0) {
      this.rooms.delete(roomId);
    }

    const userRooms = this.socketToRooms.get(socketId);
    if (userRooms) {
      userRooms.delete(roomId);
      if (userRooms.size === 0) {
        this.socketToRooms.delete(socketId);
      }
    }

    return peer;
  }

  getRoomsForSocket(socketId) {
    const set = this.socketToRooms.get(socketId);
    return set ? Array.from(set) : [];
  }
}

export const roomManager = new RoomManager();
