declare module 'simple-peer' {
  import { EventEmitter } from 'events';

  interface SignalData {
    candidate?: RTCIceCandidateInit;
    sdp?: string;
  }

  interface PeerOptions {
    initiator?: boolean;
    stream?: MediaStream;//поменять на track если addStream не работает
    trickle?: boolean;

  }

  class Peer extends EventEmitter {
    constructor(opts?: PeerOptions);
    signal(data: any): void;
    addStream(stream: MediaStream): void;//поменять на addTrack если addStream не работает
    destroy(): void;
  }

  export default Peer;
}