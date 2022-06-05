# Zeg's checklist list app

I made a simple checklist app. It uses websockets to sync changes between all the clients.

## Features

- Automatic syncing between clients
- Read-only, cloned and live-edit share
- Change order + add/remove/edit items
- Mark items as done (obviously)
- Recently opened lists
- Custom named lists

## Built with

The website was built with React, hosted on Pages. For the backend, I used Cloudflare Workers. Live-edit lists are stored in Durable Objects, these also have the WebSocket connections. The read-only lists are saved in KV. It uses the browser's local storage to store the recently opened lists.

## Built for

This project was made for the [Cloudflare Developer Challenge](https://challenge.developers.cloudflare.com/) of Spring 2022.

## Plans

- fix alignment of status indicator on small devices
- redesign add and remove button
- communicate more clearly that you can edit and reorder entries
- add list name changing
- add favorite lists
- make into PWA (if time permits)
