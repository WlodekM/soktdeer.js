import { EventEmitter } from "node:events";
import * as SDtypes from "./sd-types.ts"
import Post from "./post.ts";

export default class SoktDeer {
    token: string = '';
    username: string = '';
    loggedIn: boolean = false;
    ws: WebSocket;
    wsEvents: EventEmitter = new EventEmitter();
    messages: SDtypes.Post[] = [];
    events: EventEmitter = new EventEmitter();

    wsUri: string;
    pingInterval?: number;

    creds: [string, string] = ['', ''];

    constructor(wsUri = "wss://sokt.meltland.dev") {
        this.wsUri = wsUri
        this.ws = this.connect(this.wsUri)
    }

    reopen() {
        console.error("connection cloed");
        this.wsEvents.off('new_post', this.handlePost);
        this.connect(this.wsUri);
        if(this.pingInterval) clearInterval(this.pingInterval); // clear ping interval
        if(this.creds[0]) {
            this.ws.addEventListener('open', () => {
                this.login(...this.creds)
            })
        }
    }

    handlePost ({ data: post }: { data: SDtypes.Post }) {
        console.log(this.loggedIn)
        this.messages.push(post);
        this.events.emit('post', new Post(post, this))
    }

    connect(wsUri: string) {
        const ws = new WebSocket(wsUri);
        ws.onmessage = (rdata) => {
            const data = JSON.parse(rdata.data.toString());
            // console.info("SD", "INCOMING", data)
            if ('command' in data) return this.wsEvents.emit(data.command, data);
            if ('error' in data
                && Object.keys(data).filter(k => !['error', 'code'].includes(k)).length > 0)
                return this.wsEvents.emit(
                    Object.keys(data).filter(k => !['error', 'code'].includes(k))[0],
                    data
                )
            if ('error' in data) return this.wsEvents.emit('error', data);
        }
        this.wsEvents.once('greet', greetp => {
            this.messages = greetp.messages.reverse();
            this.events.emit('ready')
        })
        this.wsEvents.on('new_post', this.handlePost);
        ws.onopen  = () => this.pingInterval = setInterval(() => this.ping.call(this), 5000);
        ws.onclose = () => this.reopen
        ws.onerror = () => this.reopen;
        return ws
    }

    login(username: string, password: string): Promise<string> {
        this.username = username;
        this.creds = [username, password];
        return new Promise((resolve, reject) => {
            this.ws.send(JSON.stringify({
                command: "login_pswd",
                username,
                password
            }))
            this.loggedIn = true;
            this.wsEvents.once('token', ({ token }) => {
                this.token = token;
                resolve(token)
            })
            this.wsEvents.once('error', error => {
                if (error.error) {
                    reject(error.code)
                }
            })
        })
    }

    loginToken(token: string, username: string): Promise<void> {
        this.username = username
        return new Promise((resolve, reject) => {
            this.ws.send(JSON.stringify({
                command: "login_token",
                token,
                username
            }))
            this.loggedIn = true;
            this.wsEvents.once('error', error => {
                if (error.error) reject(error.code)
                else resolve()
            })
        })
    }

    getUser(username: string): Promise<SDtypes.ExtendedUser> {
        return new Promise((resolve, reject) => {
            this.ws.send(JSON.stringify({
                command: "get_user",
                username
            }))
            this.wsEvents.once('user', resp => {
                if (resp.error) reject(resp.code)
                else resolve(resp.user)
            })
        })
    }

    post(post: SDtypes.SendPost): void {
        if (!post.replies) post.replies = [];
        if (!post.attachments) post.attachments = [];
        this.ws.send(JSON.stringify({
            command: "post",
            ...post
        }))
    }

    ping(): void {
        if(this.ws.readyState != this.ws.OPEN) return console.warn('Tried to ping when not OPEN');
        this.ws.send(JSON.stringify({ command: "ping" }))
    }
}