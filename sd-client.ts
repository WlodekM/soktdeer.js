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

    constructor(wsUri = "wss://sokt.meltland.dev") {
        this.wsUri = wsUri
        this.ws = this.connect(this.wsUri, this)
    }

    reopen() {
        console.error("connection cloed");
        if(this.pingInterval) clearInterval(this.pingInterval); // clear ping interval
        this.wsEvents.off('new_post', this.handlePost);
        this.connect(this.wsUri, this);
        if(this.token) {
            this.ws.addEventListener('open', () => {
                this.loginToken(this.token, this.username)
            })
        }
    }

    handlePost ({ data: post }: { data: SDtypes.Post }, client: SoktDeer) {
        client.messages.push(post);
        client.events.emit('post', new Post(post, client))
    }

    connect(wsUri: string, client: SoktDeer) {
        const ws = new WebSocket(wsUri);
        ws.onmessage = (rdata) => {
            const data = JSON.parse(rdata.data.toString());
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
            if(greetp.messages)
                this.messages = greetp.messages.reverse();
            this.events.emit('ready')
        })
        this.wsEvents.on('new_post', (data) => this.handlePost(data, client));
        ws.onopen  = () => this.pingInterval = setInterval(() => this.ping.call(this), 5000);
        ws.onclose = () => this.reopen
        ws.onerror = () => this.reopen;
        return ws
    }

    login(username: string, password: string): Promise<string> {
        this.username = username;
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