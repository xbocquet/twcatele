# Twinit Carbon App

A simple React application using IBM Carbon Design System that connects to the Twinit platform without using the IPA core framework.


## Features

- ✅ React 18 with Vite
- ✅ IBM Carbon Design System
- ✅ Direct connection to Twinit platform using `@dtplatform/platform-api`
- ✅ No IPA core framework dependency
- ✅ Simple, clean architecture

## Setup

1. **Configure npm authentication** (required for `@dtplatform/platform-api`):
   - Copy `.npmrc.example` to `.npmrc`:
     ```bash
     cp .npmrc.example .npmrc
     ```
   - Set the following environment variables (or edit `.npmrc` directly with your credentials):
     - `DTPLATFORM_KEY`: Your npm username/key
     - `DTPLATFORM_SECRET_BASE64`: Your npm password/token encoded in base64
     - `DTPLATFORM_EMAIL`: Your npm email
   
   **Note**: `.npmrc` is in `.gitignore` to protect your credentials. Never commit it with real values.

2. Install dependencies:
```bash
npm install
```

3. Configure the platform connection by editing `public/config.js`:
```javascript
const endPointConfig = {
  itemServiceOrigin: 'https://sandbox-api.invicara.com',
  passportServiceOrigin: 'https://sandbox-api.invicara.com',
  // ... other endpoints
  applicationId: 'your-application-id'
}
```

3. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Build

To build for production:
```bash
npm run build
```

## Project Structure

```
twinitcarbon/
├── public/
│   └── config.js          # Platform endpoint configuration
├── src/
│   ├── App.jsx            # Main application component
│   ├── App.scss           # Application styles
│   ├── main.jsx           # Application entry point
│   └── index.scss         # Global styles with Carbon
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies
```

## Platform Connection

The app uses `@dtplatform/platform-api` to connect to the Twinit platform:

- `IafSession.setConfig()` - Configures the platform endpoints
- `IafSession.setErrorCallback()` - Handles platform errors
- `IafProj.getCurrent()` - Gets the current project (requires authentication)

## Notes

- Authentication is required to access most platform resources
- The app shows connection status and basic platform information
- You can extend the app to add authentication, project management, and other features

