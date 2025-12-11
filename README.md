# IP Geolocation & Interactive Map Viewer

A lightweight React + Vite application that visualizes your approximate location on an interactive map and displays key network details. Built for speed and simplicity, it leverages modern tooling and a handful of carefully chosen APIs and libraries.

## What it does
- Detects the visitor’s IP address and geolocation in real time  
- Renders a responsive, interactive map centered on the user’s coordinates  
- Surfaces ISP, timezone, country, city, and proxy/VPN status at a glance  

## Core APIs & Services
- [ipinfo.io](https://ipinfo.io) – ultra-fast IP geolocation and network intelligence  
- [MapLibre GL JS](https://maplibre.org) – open-source, WebGL-powered interactive maps (MapLibre tile server)  

## Development Stack
- **React 18** – component-driven UI with Fast Refresh  
- **Vite** – instant HMR, lightning-fast builds, native ESM  
- **ESLint** – consistent code quality (extends recommended React rules)  
- **CSS Modules** – scoped, maintainable styling out of the box  

## Tools that helped shape the project
- Trae CUE – contextual code suggestions and snippets  
- ChatGPT / Trae Builder/Coder – architectural advice, debugging help, and documentation polish  
- Chrome DevTools & React DevTools – performance profiling and component inspection  
- Stitch – quick wireframes, ui designs and color palette decisions 

## Next Steps
- Add TypeScript for stricter type safety  
- Introduce unit tests with Vitest  
- Deploy to Vercel or Netlify with zero-config CI  
- Add other integrations to add more features into the app

Feel free to fork, tweak, or rip apart—issues and PRs welcome!

To understand the project's architecture and development process, please refer to the [system guide](docs/system-guide.md).

Thank you for checking out the IP Geolocation & Interactive Map Viewer!
Developer: Franc Alvenn Dela Cruz