import Post from "./post.ts";
import SoktDeer from "./sd-client.ts";

const bot: SoktDeer = new SoktDeer();
const creds: {
    username: string
    password: string
} = JSON.parse(new TextDecoder().decode(Deno.readFileSync('creds.json')));

bot.events.on('ready', () => {
    console.info('READY!!')
    bot.login(creds.username, creds.password)

    bot.events.on('post', (post: Post) => {
        if (!post.content.startsWith(`@${bot.username}`)) return;
        post.reply('hai')
    })
})