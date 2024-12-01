import * as SDtypes from "./sd-types.ts"
import SoktDeer from "./sd-client.ts";

export default class Post {
    id: number;
    created: number;
    content: string;
    replies: SDtypes.Reply[];
    attachments: string[];
    author: SDtypes.User;
    bot?: SoktDeer;
    constructor (post: SDtypes.Post, bot?: SoktDeer) {
        this.id = post.id;
        this.created = post.created;
        this.content = post.content;
        this.replies = post.replies;
        this.attachments = post.attachments;
        this.author = post.author;
        this.bot = bot
    }

    async getAuthor() {
        if (this.bot) return await this.bot.getUser(this.author.username);
        else return this.author;
    }

    reply(post: SDtypes.SendPost | string) {
        if(typeof post == 'string') post = { content: post, attachments: [], replies: [] }
        if(!post.replies) post.replies = [];
        if(!this.bot) throw new Error('Post.reply requires bot to be specified')
        post.replies.unshift(this.id);
        if(post.replies.length > 3) post.replies = post.replies.slice(0, 3);
        this.bot?.post(post)
    }
}