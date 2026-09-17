# Algo Forum

A tiny markdown forum for programming-school students. Students upload `.md` files describing an algorithm; everyone else browses and reads them. No login, no database — just a folder of markdown files parsed into nice pages.

## Layout

- `server/`  – Node + Express API. Stores each upload as a `.md` file in `server/data/`.
- `client/`  – Vite + React frontend.

## Format for each markdown file

Use top-level headings (`#`) to structure the page:

1. `# Name - What is this algorithm?`  (the first heading becomes the title)
2. `# Important information about this specific algorithm and usage example`
3. `# Visual representation of an example`
4. `# Example usage in C++`

Any other `#` headings are shown as regular sections too. Images referenced with `![](file.png)` next to the markdown file are displayed inside the page.

## Running it

Open two terminals.

Terminal 1 (server):
```bash
cd server
npm install
npm run dev
```

Terminal 2 (client):
```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. The client proxies `/api` and `/uploads` to the server on port 4000.

> **Note for Windows PowerShell users:** if typing `npm` throws a "`.ps1 cannot be loaded ... running scripts is disabled" error, that's the PowerShell execution policy blocking npm. Run the npm CLI directly with node instead (same commands):
>
> ```bash
> node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
> node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
> ```
>
> (Or temporarily allow scripts for your session with `Set-ExecutionPolicy -Scope Process CurrentUser`.)

## Who can delete?

The **Delete** button only appears when you access the site from `localhost` (the machine hosting the server). Everyone else sees read-only pages.
