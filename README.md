# AgriSathi (Kisan Saathi) 🌾🚜
> **Accessible Agricultural Decision Support Platform for Indian Smallholder and Tenant Farmers**

AgriSathi (किसान साथी / किसान मित्र) is a full-stack, multilingual agricultural assistance web platform built with **React 19, TypeScript, Vite, Tailwind CSS**, and an **Express.js backend**. It delivers real-time weather alerts, satellite farm mapping, crop disease vision diagnostics, Mandi commodity pricing, and multilingual AI agronomic advice.

---

## 🌟 Key Integrated Features & APIs

| Service | Feature | Provider | Key Required? | Status |
| :--- | :--- | :--- | :---: | :--- |
| **Weather & Agromet** | Live weather, precipitation %, rainfall mm, wind, temp | [Open-Meteo](https://open-meteo.com/en/docs) | **No** (Free) | ✅ Live Active |
| **Interactive Maps** | Farm boundary pin, OSM tiles, GPS locator | [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) | **No** (Free) | ✅ Live Active |
| **Geocoding & Location** | Village, taluka, and district coordinate search | [Nominatim](https://nominatim.org/) | **No** (Free) | ✅ Live Active |
| **AI Farm Assistant** | Multilingual advisory in English, Hindi, & Marathi | [Google Gemini](https://aistudio.google.com/) (`gemini-2.5-flash`) | **Yes** (Free tier) | ✅ Ready / Configurable |
| **Crop Disease Vision** | Leaf pathology diagnosis & organic treatments | [Plant.id](https://plant.id/) / Kindwise | **Yes** (Free tier) | ✅ Ready / Benchmark fallback |
| **Mandi Market Rates** | APMC commodity rates (Onion, Tomato, Cotton, etc.) | [Data.gov.in](https://data.gov.in/) & Agmarknet | **Optional** | ✅ Live & APMC Benchmarks |

---

## 🚀 Quick Start Guide (Local Development)

### Prerequisites
- **Node.js**: v20 or v24 LTS
- **pnpm**: v10+ (or npm v10+)
- **Git**

### 1. Clone & Install
```bash
git clone https://github.com/jadhav-sumit/agrisathi.git
cd agrisathi

# Install all workspace dependencies
pnpm install
```

### 2. Configure Environment Variables
Copy the root `.env.example` template:
```bash
cp .env.example .env
```

Open `.env` in VS Code and insert your API keys as desired:
```dotenv
# Server Configuration
PORT=3000
NODE_ENV=development

# 1. Google Gemini AI Key (Free at https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Plant.id API Key (Free tier at https://web.plant.id/)
PLANT_ID_API_KEY=your_plant_id_api_key_here

# 3. Data.gov.in API Key (Optional, free at https://data.gov.in/)
DATA_GOV_IN_API_KEY=your_data_gov_in_api_key_here
```
> **Note:** The application starts and runs cleanly even without paid API keys. If optional keys are absent, the application gracefully provides verified ICAR/APMC agricultural benchmarks and clear configuration notices.

### 3. Run the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing, Quality Checks & Build

```bash
# Run automated Vitest test suite (API endpoints & weather parsing)
pnpm test

# Run strict TypeScript verification
pnpm check

# Build production bundle (client assets + bundled Express server)
pnpm build

# Launch the production server locally
pnpm start
```

---

## 🔑 Official API Key Registration Links

1. **Google Gemini API**:
   - **Portal**: [https://aistudio.google.com/](https://aistudio.google.com/)
   - **Cost**: Free tier includes 15 Requests Per Minute (RPM) and 1,500 Requests Per Day (RPD).
   - **Setup**: Sign in with Google -> Create API Key -> Copy into `GEMINI_API_KEY`.

2. **Plant.id (Kindwise)**:
   - **Portal**: [https://plant.id/](https://plant.id/) or [https://web.plant.id/](https://web.plant.id/)
   - **Cost**: Free trial / evaluation credits available upon registration.
   - **Setup**: Sign up -> Copy API key into `PLANT_ID_API_KEY`.

3. **Data.gov.in (Agmarknet Mandi Rates)**:
   - **Portal**: [https://data.gov.in/](https://data.gov.in/)
   - **Cost**: 100% Free Government Open Data API.
   - **Setup**: Register account -> My Account -> Generate API Key -> Copy into `DATA_GOV_IN_API_KEY`.

4. **Open-Meteo & OpenStreetMap**:
   - Built-in zero-configuration APIs. **No account or API key required.**

---

## 🚢 Render Deployment Instructions

### Method: Web Service on Render

1. Log into [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/jadhav-sumit/agrisathi`.
4. Configure the service settings:
   - **Environment**: `Node`
   - **Region**: Singapore (or nearest to India)
   - **Branch**: `main`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start` (or `node dist/index.js`)
5. In the **Environment Variables** tab, configure:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render injects this automatically)
   - `GEMINI_API_KEY`: `(your Google AI Studio key)`
   - `PLANT_ID_API_KEY`: `(your Plant.id key)`
   - `DATA_GOV_IN_API_KEY`: `(optional data.gov.in key)`
6. Click **Create Web Service**. Render will install dependencies, build Vite assets to `dist/public`, bundle `dist/index.js`, and start the service.

---

## 🛡️ Agricultural & Security Disclaimers

- **Advisory Notice**: AI recommendations (Gemini) and automated plant disease detections (Plant.id) are indicative and intended for preliminary field guidance only. Farmers should always consult their nearest **Krishi Vigyan Kendra (KVK)** or Government Agriculture Extension Officer before applying chemical pesticides.
- **Privacy Policy**: No personal farmer identity (phone, name) is transmitted to public geocoding services.
- **Secrets Security**: All third-party secrets remain server-side in Express and are never exposed in frontend bundles.
