# 🥂 GLASSBOX // FORENSIC TRIAGE

> **Shattering the opacity of digital evidence.**

## 📖 The Crisis

In modern investigations, the phone is the primary witness. Tools like **Cellebrite** do a great job of extracting data, but they leave investigators with a "data dump" nightmare. Manual review of gigabytes of chat logs and location pings is a slow, soul-crushing process that leads to fatigue and missed evidence.

**Extraction is solved. Analysis is broken.**

## 💡 The Solution

**Glassbox** is an automated triage layer that sits between raw forensic exports and the investigator. It doesn't just "show" data; it filters for intent.

- **⚡ Lightning Triage:** Instantly parses exported CSV/Excel datasets from major forensic tools.
- **🎯 Heuristic Filtering:** Uses keyword matching to flag high-priority conversations while silencing the noise of everyday "junk" data.
- **⏳ Temporal Mapping:** Visualizes communication spikes and location clusters to find patterns human eyes miss.
- **📉 Footprint Reduction:** Turns days of manual reading into minutes of targeted review.

---

## 🏗️ Technical Architecture (Professional Grade)

Glassbox is built to be a robust, high-performance, and maintainable enterprise-grade application. It is primarily built with **React** (Vite), **Tailwind CSS v4**, and modern ecosystem tools.

### Tech Stack
- **Frontend Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (v4) + clsx + tailwind-merge
- **Animations:** Framer Motion
- **Data Fetching:** Axios + TanStack React Query (Scalable state/caching)
- **Routing:** React Router v7
- **Code Splitting:** React `lazy` + `Suspense` for optimized bundle sizing.

### CI/CD & Hygiene Pipeline
A rigorous development pipeline is configured to ensure code quality:
- **Linting & Formatting:** ESLint + Prettier mapped to VSCode format-on-save.
- **Pre-commit Hooks:** Husky combined with `lint-staged` prevents pushing bad code or broken tests.
- **Automated Testing:** Unit testing powered by **Vitest** + React Testing Library.
- **CI Pipelines:** GitHub Actions automatically checks builds, lints, and tests for every pull request.
- **Error Boundaries:** App-wide crash protection using `react-error-boundary`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd Glassbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file based on `.env.example` (if present) or add:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. Start the Development Server:
   ```bash
   npm run dev
   ```

### Scripts

- `npm run dev` - Starts the Vite development server.
- `npm run build` - Builds the app for production.
- `npm run lint` - Runs ESLint.
- `npm run format` - Runs Prettier to auto-format source files.
- `npm run test` - Runs Vitest unit tests.
- `npm run preview` - Previews the production build locally.

---

## 📊 Status

`[⚡] Active Development Phase`

- [x] Project Conceptualization
- [x] Enterprise Architecture Setup (React Query, CI/CD, Testing)
- [x] Component Library Foundation (Tailwind + Headless UI philosophy)
- [ ] Core Parser Implementation
- [ ] Heuristic Engine v1
- [ ] Temporal Dashboard Integration

---

## ⚠️ Disclaimer

*This tool is intended for use by law enforcement and authorized forensic professionals. Use responsibly.*
