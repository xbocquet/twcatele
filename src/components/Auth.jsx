import React, { useState, useEffect } from 'react'
import {
  Button,
  TextInput,
  Tile,
  InlineNotification,
} from '@carbon/react'
import { IafSession } from '@dtplatform/platform-api'
import './Auth.scss'

const defaultAppId = 'bee96d08-589b-4202-a1d0-8016c1cdb5be'

const Auth = ({ onAuthenticated, endPointConfig }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState(null)
  const [appId, setAppId] = useState(() => {
    // Load from localStorage or use default
    const stored = localStorage.getItem('twinit_appId')
    return stored || defaultAppId
  })


  useEffect(() => {
    // Check if we're returning from OAuth callback
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const error = params.get('error')
      const errorDescription = params.get('error_description')
      
      if (error) {
        // OAuth error occurred
        setError(`Authentication failed: ${errorDescription || error}. Please check that the Application ID is valid and registered for OAuth.`)
        setIsAuthenticating(false)
        // Clean up the URL
        window.history.replaceState(null, null, window.location.pathname)
        return
      }
      
      if (accessToken) {
        handleOAuthCallback(accessToken)
        // Clean up the URL
        window.history.replaceState(null, null, window.location.pathname)
      }
    }

    // Check for stored token
    const storedToken = localStorage.getItem('twinit_token')
    const storedEnv = localStorage.getItem('twinit_env')
    
    if (storedToken && storedEnv) {
      // Verify token is still valid by trying to use it
      setupSession(storedEnv, storedToken)
    }
  }, [])

  const setupSession = async (env, token) => {
    try {
      setIsAuthenticating(true)
      setError(null)

      // Store token, environment, and appId
      localStorage.setItem('twinit_token', token)
      localStorage.setItem('twinit_env', env)
      localStorage.setItem('twinit_appId', appId)

      // Configure session
      await IafSession.setConfig({
        itemServiceOrigin: env,
        passportServiceOrigin: env,
        fileServiceOrigin: env,
        datasourceServiceOrigin: env,
        graphicsServiceOrigin: env,
        baseRoot: window.location.origin,
        applicationId: appId,
      })

      // Set the authentication token in the session
      IafSession.setAuthToken(token, undefined)
      
      onAuthenticated(token, env)
    } catch (err) {
      console.error('Failed to setup session:', err)
      setError(`Authentication failed: ${err.message || 'Unknown error'}`)
      localStorage.removeItem('twinit_token')
      localStorage.removeItem('twinit_env')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleOAuthCallback = (token) => {
    const env = endPointConfig?.passportServiceOrigin || endPointConfig?.itemServiceOrigin
    if (env) {
      // Use current appId from state
      setupSession(env, token)
    } else {
      setError('Endpoint configuration missing')
    }
  }

  const handleLogin = () => {
    try {
      setIsAuthenticating(true)
      setError(null)

      const env = endPointConfig?.passportServiceOrigin || endPointConfig?.itemServiceOrigin
      const clientId = appId.trim() || defaultAppId
      const redirectUri = `${window.location.origin}${window.location.pathname}`

      if (!env || !clientId) {
        setError('Missing endpoint configuration (environment or application ID)')
        setIsAuthenticating(false)
        return
      }

      // Validate appId format (should be a UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(clientId)) {
        setError('Invalid Application ID format. Please enter a valid UUID (e.g., bee96d08-589b-4202-a1d0-8016c1cdb5be)')
        setIsAuthenticating(false)
        return
      }

      // Store appId before redirecting
      localStorage.setItem('twinit_appId', clientId)

      // Redirect to OAuth authorize endpoint
      const authUrl = `${env}/passportsvc/api/v1/oauth/authorize/?client_id=${clientId}&response_type=token&scope=read write&redirect_uri=${encodeURIComponent(redirectUri)}`
      
      console.log('Redirecting to OAuth:', authUrl)
      window.location.href = authUrl
    } catch (err) {
      console.error('Failed to initiate login:', err)
      setError(`Login failed: ${err.message || 'Unknown error'}`)
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('twinit_token')
    localStorage.removeItem('twinit_env')
    window.location.reload()
  }

  return (
    <div className="auth-container">
      <Tile>
        <h2>Twinit Platform Authentication</h2>
        <p>Please sign in to access the Twinit platform</p>
        
        {error && (
          <InlineNotification
            kind="error"
            title="Authentication Error"
            subtitle={error}
            lowContrast
            onClose={() => setError(null)}
            style={{ marginTop: '1rem' }}
          />
        )}

        <div style={{ marginTop: '2rem' }}>
          <TextInput
            id="endpoint-input"
            labelText="Endpoint"
            value={endPointConfig?.passportServiceOrigin || endPointConfig?.itemServiceOrigin || ''}
            disabled
            size="md"
            style={{ marginBottom: '1rem' }}
          />
          
          <TextInput
            id="appid-input"
            labelText="Application ID"
            value={appId}
            onChange={(e) => {
              const newAppId = e.target.value.trim()
              setAppId(newAppId)
            }}
            size="md"
            style={{ marginBottom: '0.5rem' }}
            placeholder={defaultAppId}
            helperText="The Application ID must be registered for OAuth with the redirect URI: http://localhost:8083/"
          />
          
          <Button
            kind="ghost"
            size="sm"
            onClick={() => {
              setAppId(defaultAppId)
            }}
            style={{ marginBottom: '1.5rem', width: '100%', justifyContent: 'flex-start' }}
          >
            Use Default ({defaultAppId.substring(0, 8)}...)
          </Button>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Button
            onClick={handleLogin}
            disabled={isAuthenticating || !appId.trim()}
            size="lg"
          >
            {isAuthenticating ? 'Authenticating...' : 'Sign In with Twinit'}
          </Button>
        </div>
      </Tile>
    </div>
  )
}

export default Auth

