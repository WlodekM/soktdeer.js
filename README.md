# soktdeer.js

a javascript library for soktdeer.

also has utilities for bots.

## examples.

### sd-bot.

for making bots.

```ts
import SoktBot from './soktdeer.js/sd-bot.ts';

const bot = new SoktBot({
    username: 'cool-bot',
    password: 'password here'
});

bot.command('word', {
    args: ['word'],
    aliases: [],
    fn: ({ args: [word], reply }) => {
        reply(word)
    }
})
```

### sd-client.

for making clients and such.

```ts
import SoktClient from './soktdeer.js/sd-client.ts'

const client = new SoktClient()

const username = document.getElementById('username').value;
const password = document.getElementById('password').value;
const token = await client.login(username, password);
localStorage.setItem('token', token);
localStorage.setItem('username', username); // pro tip: store this too for token login.
```

### sd-types.

for when you have your own system.

<!-- honestly i have no idea why i should put this in the readme, oh well -->

```ts
import SoktTypes from './soktdeer.js/sd-types.ts'

const ws = new Websocket(/* ... */)

ws.addEventListener('message', data => {
    const json: SoktTypes.Packet = JSON.parse(data.toString());

    switch (json.command) {
        // ...
        case 'new_post':
            const post: SoktTypes.Post = json.data as SoktTypes.Post;
            // ...
            break;
    }
})
```