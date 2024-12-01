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