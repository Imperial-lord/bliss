/**
 * In-memory room, peer, host authority, and media playback state registry.
 */
class RoomManager {
  constructor() {
    // roomId -> Map<socketId, peerData>
    this.rooms = new Map();
    // socketId -> Set<roomId>
    this.socketToRooms = new Map();
    // roomId -> { hostSocketId, media: { status, title, sourceUrl, subtitles, playback: { isPlaying, currentTime, updatedAt } } }
    this.roomMetadata = new Map();
  }

  joinRoom(roomId, socketId, peerData) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }

    if (!this.roomMetadata.has(roomId)) {
      this.roomMetadata.set(roomId, {
        hostSocketId: socketId,
        media: {
          status: 'idle', // 'idle' | 'downloading_metadata' | 'ready'
          title: '',
          sourceUrl: '',
          fileSize: 0,
          subtitles: [],
          playback: {
            isPlaying: false,
            currentTime: 0,
            updatedAt: Date.now()
          }
        }
      });
    }

    const room = this.rooms.get(roomId);
    const meta = this.roomMetadata.get(roomId);
    const isHost = meta.hostSocketId === socketId;

    const existing = room.get(socketId) || {};
    const peer = {
      socketId,
      userId: peerData.userId,
      userName: peerData.userName || `User_${socketId.substring(0, 4)}`,
      avatarId: peerData.avatarId || 'cyber-rebel',
      audioEnabled: peerData.audioEnabled ?? true,
      videoEnabled: peerData.videoEnabled ?? true,
      joinedAt: Date.now(),
      isHost,
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

  getRoomHost(roomId) {
    const meta = this.roomMetadata.get(roomId);
    return meta ? meta.hostSocketId : null;
  }

  isHost(roomId, socketId) {
    const meta = this.roomMetadata.get(roomId);
    return meta ? meta.hostSocketId === socketId : false;
  }

  getMediaState(roomId) {
    const meta = this.roomMetadata.get(roomId);
    if (!meta) return null;

    const media = { ...meta.media };
    // Compute current real-time playback timestamp if actively playing
    if (media.playback && media.playback.isPlaying) {
      const elapsed = (Date.now() - media.playback.updatedAt) / 1000;
      media.playback = {
        ...media.playback,
        currentTime: media.playback.currentTime + elapsed
      };
    }
    return media;
  }

  setRoomMedia(roomId, mediaData) {
    const meta = this.roomMetadata.get(roomId);
    if (!meta) return null;

    meta.media = {
      ...meta.media,
      ...mediaData,
      playback: {
        ...meta.media.playback,
        ...(mediaData.playback || {})
      }
    };
    return meta.media;
  }

  updatePlayback(roomId, action, currentTime) {
    const meta = this.roomMetadata.get(roomId);
    if (!meta) return null;

    const isPlaying = action === 'play';
    meta.media.playback = {
      isPlaying,
      currentTime: typeof currentTime === 'number' ? currentTime : meta.media.playback.currentTime,
      updatedAt: Date.now()
    };
    return meta.media.playback;
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

    const meta = this.roomMetadata.get(roomId);
    let newHost = null;

    if (room.size === 0) {
      this.rooms.delete(roomId);
      this.roomMetadata.delete(roomId);
    } else if (meta && meta.hostSocketId === socketId) {
      // Reassign host authority to the next earliest joined peer
      const remaining = Array.from(room.values()).sort((a, b) => a.joinedAt - b.joinedAt);
      if (remaining.length > 0) {
        newHost = remaining[0];
        newHost.isHost = true;
        meta.hostSocketId = newHost.socketId;
      }
    }

    const userRooms = this.socketToRooms.get(socketId);
    if (userRooms) {
      userRooms.delete(roomId);
      if (userRooms.size === 0) {
        this.socketToRooms.delete(socketId);
      }
    }

    return { peer, newHost, roomEmpty: room.size === 0 };
  }

  getRoomsForSocket(socketId) {
    const set = this.socketToRooms.get(socketId);
    return set ? Array.from(set) : [];
  }
}

export const roomManager = new RoomManager();
