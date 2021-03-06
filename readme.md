# Zeg's checklist list app

I made a simple checklist app. It uses websockets to sync changes between all the clients.

## Features

- 🚀 Live syncing between clients
- 📤 Read-only, cloned and live-edit share
- ↕️ Change order with drag-and-drop
- ✏️ Edit items by clicking on them
- 📱 Responsive design
- 🕛 Recently opened lists
- ⭐ Favorite lists
- 🌙 Togglable dark mode
- ✔️ add/remove/complete items (obviously)
- 📝 Custom named lists
- ♿ Accessible

## Built with

The website was built with React, hosted on Pages. For the backend, I used Cloudflare Workers. Live-edit lists are stored in Durable Objects, these also have the WebSocket connections. The read-only lists are saved in KV. It uses the browser's local storage to store the recently opened lists.

## Built for

This project was made for the [Cloudflare Developer Challenge](https://challenge.developers.cloudflare.com/) of Spring 2022.
