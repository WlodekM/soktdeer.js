export type User = {
    username: string,
    display_name: string,
    avatar?: string | null,
    created: number,
    verified?: string,
    bio: string,
    lastfm: string
}

export type ExtendedUser = User & {
    banned_until: number,
    permissions: string[],
}

export type Reply = {
    id: number,
    created: number,
    content: string,
    replies: Reply[]
    attachments: string[],
    author: User
}

export type Post = {
    id: number,
    created: number,
    content: string,
    replies: Reply[],
    attachments: string[],
    author: User
}

export type SendPost = {
    content: string,
    replies?: number[],
    attachments?: string[]
}

export type Packet = {
    command?: string,
    listener: string | null,
    // deno-lint-ignore no-explicit-any
    data?: Post | User | any // use any for packets that i have not added yet
}