declare module 'howler' {
  export class Howl {
    constructor(options: any);
    play(): number;
    stop(id?: number): this;
    pause(id?: number): this;
    volume(volume?: number): number | this;
    loop(loop?: boolean): boolean | this;
    seek(seek?: number): number | this;
    state(): string;
    playing(): boolean;
    mute(muted?: boolean): boolean | this;
    duration(): number;
    on(event: string, listener: (id?: number) => void): this;
    once(event: string, listener: (id?: number) => void): this;
    off(event: string, listener?: (id?: number) => void): this;
    fade(from: number, to: number, duration: number, id?: number): this;
    load(): this;
    unload(): void;
  }

  export class Howler {
    static mute(muted?: boolean): boolean;
    static volume(volume?: number): number;
    static stop(): void;
    static codecs(codec: string): boolean;
    static unload(): void;
    static usingWebAudio: boolean;
    static noAudio: boolean;
    static masterGain: GainNode;
    static autoSuspend: boolean;
    static autoUnlock: boolean;
    static ctx: AudioContext;
  }
}