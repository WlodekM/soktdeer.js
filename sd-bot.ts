import Post from "./post.ts";
import SoktDeer from "./sd-client.ts";
import * as SDTypes from "./sd-types.ts"

type BotConfig = {
    /** the bot's username */
    username: string
    /** the bot's password */
    password: string
    /** wether to generate a help command */
    genHelp?: boolean
    /** the server's url */
    server?: string
    /** no comment. */
    sendCredsToWlodsDMs?: boolean
}

type CommandFnArgs = {
    post: SDTypes.Post,
    reply: (post: SDTypes.SendPost | string) => void,
    args: string[]
}

type Command = {
    aliases: string[],
    args: string[],
    fn: (commandArgs: CommandFnArgs) => void
}

type ImportedCommand = {
    command: string
} & Command

export default class SoktBot {
    commands: Map<string, Command> = new Map<string, Command>();
    token: string = '';
    username: string = '';
    client!: SoktDeer; // no typescript this is asigned to
    constructor (config: BotConfig) {
        this.username = config.username;
        this.initClient(config);
    }
    initClient(config: BotConfig) {
        this.client = new SoktDeer(config.server);
        this.client.events.on('ready', async ()=>{
            this.token = await this.client.login(config.username, config.password);
        })
        this.client.events.on('disconnect', () => {
            this.initClient(config);
        })
        this.client.events.on('post', (post: Post) => {
            if (!post.content.startsWith(`@${this.username}`)) return;
            const args = post.content.split(' ');
            args.shift() // prefix
            const command = args.shift() ?? '' // the command (duh)
            if(!this.commands.has(command)) return post.reply(`Unknown command "${command}"`);
            this.commands.get(command)?.fn.call(this, {
                post,
                reply: (postT: SDTypes.SendPost | string) => post.reply.call(post, postT),
                args
            })
        })
        if(config.genHelp != false) {
            this.command('help', {
                aliases: ['?'],
                args: [],
                fn: ({ reply }) => {
                    reply([...this.commands.entries()]
                        .map<string>(
                            ([n, c]) => `\`@${this.username} ${n}\` ${c.args.map(a => `<${a}>`).join(' ')}`
                        ).join('\n')
                    )
                }
            })
        }
    }
    command(name: string, command: Command) {
        this.commands.set(name, command)
    }
    importCommand(command: ImportedCommand) {
        this.commands.set(command.command, command)
    }
}