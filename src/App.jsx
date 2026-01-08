import React, { useState, useEffect } from 'react'
import {
  Content,
  Header,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderMenuButton,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
  SkipToContent,
  SideNav,
  SideNavItems,
  HeaderSideNavItems,
  Theme,
  Button,
  Grid,
  Column,
  Tile,
  Loading,
  InlineNotification,
  Select,
  SelectItem,
  TextInput,
  Checkbox,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  OverflowMenu,
  OverflowMenuItem,
  Modal,
  Pagination,
  DatePicker,
  DatePickerInput,
} from '@carbon/react'
import { Notification, UserAvatar, Switcher, ChevronRight, ChevronDown, ArrowUp, ArrowDown, ArrowsVertical } from '@carbon/icons-react'
import { IafSession, IafProj, IafItemSvc, IafPassSvc, IafUserGroup } from '@dtplatform/platform-api'
import { LineChart } from '@carbon/charts-react'
import '@carbon/charts/styles.css'
import Auth from './components/Auth'
import './App.scss'

// Default endpoint configuration (can be overridden by public/config.js)
const defaultEndPointConfig = {
  itemServiceOrigin: 'https://sandbox-api.invicara.com',
  passportServiceOrigin: 'https://sandbox-api.invicara.com',
  fileServiceOrigin: 'https://sandbox-api.invicara.com',
  datasourceServiceOrigin: 'https://sandbox-api.invicara.com',
  graphicsServiceOrigin: 'https://sandbox-api.invicara.com',
  baseRoot: 'http://localhost:8083',
  applicationId: 'bee96d08-589b-4202-a1d0-8016c1cdb5be'
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProjectSelection, setShowProjectSelection] = useState(false)
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [endPointConfig, setEndPointConfig] = useState(defaultEndPointConfig)
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [collectionItems, setCollectionItems] = useState([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  
  // Collection filtering state
  const [collectionFilter, setCollectionFilter] = useState('all') // 'all', 'namedUserItem', 'telemetry', 'other'
  
  // Telemetry readings state
  const [expandedTelemetryItems, setExpandedTelemetryItems] = useState({}) // { itemId: { readings: [], loading: false } }
  
  // Date/time range filter for telemetry readings
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('23:59')
  const [useDateRange, setUseDateRange] = useState(false)
  const [predefinedDuration, setPredefinedDuration] = useState('')
  
  // Aggregation state per telemetry item
  const [telemetryAggregation, setTelemetryAggregation] = useState({}) // { itemId: { period: 'hour'|'3hours'|'day'|'month', isNumeric: true/false } }
  
  // Display mode state per telemetry item (table or chart)
  const [telemetryDisplayMode, setTelemetryDisplayMode] = useState({}) // { itemId: 'table'|'chart' }
  
  // Expanded items state (for showing all properties)
  const [expandedItems, setExpandedItems] = useState({}) // { itemId: true/false }
  
  // Pagination state for collection items
  const [firstRowIndex, setFirstRowIndex] = useState(0)
  const [currentPageSize, setCurrentPageSize] = useState(10)
  
  // Sorting state for collection items
  const [sortColumn, setSortColumn] = useState(null) // 'name', 'kind', 'unit', or null
  const [sortDirection, setSortDirection] = useState(null) // 'asc', 'desc', or null
  
  // User and user group state
  const [currentUser, setCurrentUser] = useState(null)
  const [userGroups, setUserGroups] = useState([])
  const [currentUserGroup, setCurrentUserGroup] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Header panel states
  const [userPanelOpen, setUserPanelOpen] = useState(false)
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  
  // User group management state
  const [userGroupModalOpen, setUserGroupModalOpen] = useState(false)
  const [allProjectUserGroups, setAllProjectUserGroups] = useState([])
  const [loadingUserGroups, setLoadingUserGroups] = useState(false)
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState(null)
  const [groupUsers, setGroupUsers] = useState({}) // { groupId: [users] }
  const [groupInvites, setGroupInvites] = useState({}) // { groupId: { pending: [], expired: [] } }
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false)
  
  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [selectedGroupsForInvite, setSelectedGroupsForInvite] = useState([])
  const [inviteEmails, setInviteEmails] = useState([])
  const [currentInviteEmail, setCurrentInviteEmail] = useState('')
  const [emailError, setEmailError] = useState(null)
  const [sendingInvites, setSendingInvites] = useState(false)
  
  // Page routing
  const [currentPage, setCurrentPage] = useState('home') // 'home' or 'telemetry'
  
  // Application ID state
  const [currentAppId, setCurrentAppId] = useState(() => {
    // Load from localStorage or use default
    const stored = localStorage.getItem('twinit_appId')
    return stored || defaultEndPointConfig.applicationId
  })

  useEffect(() => {
    // Load config from public/config.js using script tag
    const script = document.createElement('script')
    script.src = '/config.js'
    script.async = true
    
    script.onload = () => {
      // Check if config was loaded into window object
      if (window.endPointConfig) {
        const loadedConfig = window.endPointConfig
        setEndPointConfig(loadedConfig)
        console.log('Loaded config from config.js:', loadedConfig)
        // If config has applicationId, use it (but allow override from localStorage)
        const storedAppId = localStorage.getItem('twinit_appId')
        if (storedAppId) {
          setCurrentAppId(storedAppId)
        } else if (loadedConfig.applicationId) {
          setCurrentAppId(loadedConfig.applicationId)
        }
      }
      // Check for stored authentication
      checkAuthentication()
    }
    
    script.onerror = () => {
      console.log('config.js not found, using default configuration')
      // Check for stored authentication
      checkAuthentication()
    }
    
    document.head.appendChild(script)
    
    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const checkAuthentication = () => {
    const token = localStorage.getItem('twinit_token')
    const env = localStorage.getItem('twinit_env')
    
    if (token && env) {
      // User is authenticated, initialize connection
      setIsAuthenticated(true)
      setTimeout(() => {
        initializeConnection()
      }, 100)
    } else {
      // User needs to authenticate
      setIsLoading(false)
    }
  }

  const handleAuthenticated = async (token, env) => {
    setIsAuthenticated(true)
    setIsLoading(true)
    
    // Initialize connection after authentication
    await initializeConnection()
    // Load user info after authentication
    await loadUserInfo()
    // Load projects after authentication
    await handleLoadProjects(false)
    // Show project selection page
    setShowProjectSelection(true)
    setIsLoading(false)
  }


  const initializeConnection = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get the current config (either from state or default)
      const configToUse = endPointConfig && Object.keys(endPointConfig).length > 0 
        ? endPointConfig 
        : defaultEndPointConfig

      // Get stored token and environment
      const storedToken = localStorage.getItem('twinit_token')
      const storedEnv = localStorage.getItem('twinit_env')

      // Use stored environment if available, otherwise use config
      const env = storedEnv || configToUse.passportServiceOrigin || configToUse.itemServiceOrigin

      // Configure the Twinit platform session
      IafSession.setConfig({
        ...configToUse,
        applicationId: currentAppId, // Use current appId (from state, which may override config)
        itemServiceOrigin: env,
        passportServiceOrigin: env,
        fileServiceOrigin: env,
        datasourceServiceOrigin: env,
        graphicsServiceOrigin: env,
      })

      // Set the authentication token if available
      if (storedToken) {
        IafSession.setAuthToken(storedToken, undefined)
        console.log('Authentication token set')
      }
      
      console.log('Twinit platform configured:', configToUse)
      setIsConnected(true)

      // Set error callback
      IafSession.setErrorCallback((error) => {
        console.error('Twinit platform error:', error)
        if (error.status === 401) {
          setError('Authentication failed. Please check your credentials.')
          setIsConnected(false)
        } else {
          setError(`Platform error: ${error.message || 'Unknown error'}`)
        }
      })

      // Load projects automatically after connection (without showing loading state)
      await handleLoadProjects(false)

      // Try to get current project (if authenticated)
      try {
        const project = IafProj.getCurrent()
        if (project) {
          setCurrentProject(project)
          // Load user info and user groups
          loadUserInfo()
          loadUserGroups(project)
        }
      } catch (err) {
        console.log('No current project or not authenticated:', err)
      }

    } catch (err) {
      console.error('Failed to initialize connection:', err)
      setError(`Failed to connect: ${err.message || 'Unknown error'}`)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserInfo = async () => {
    try {
      const authToken = await IafSession.getAuthToken()
      const ctx = { authToken }
      const user = await IafPassSvc.getCurrentUser(ctx)
      setCurrentUser(user)
      console.log('Current user:', user)
    } catch (err) {
      console.error('Failed to load user info:', err)
    }
  }

  const loadUserGroups = async (project) => {
    try {
      if (!project) return
      
      const authToken = await IafSession.getAuthToken()
      const ctx = {
        _namespaces: project._namespaces || [],
        authToken: authToken
      }

      // Get user groups for current user in this project
      const userGroupsResult = await IafProj.getUserGroupsForCurrentUser(project, ctx)
      
      if (userGroupsResult && Array.isArray(userGroupsResult)) {
        setUserGroups(userGroupsResult)
        // Set first user group as current (or use stored preference)
        if (userGroupsResult.length > 0) {
          const storedGroupId = localStorage.getItem(`userGroup_${project._id}`)
          const selectedGroup = storedGroupId 
            ? userGroupsResult.find(ug => ug._id === storedGroupId) || userGroupsResult[0]
            : userGroupsResult[0]
          setCurrentUserGroup(selectedGroup)
        }
        console.log('User groups:', userGroupsResult)
      }

      // Check if user is admin (has accessAll permission or is in admin group)
      // This is a simplified check - adjust based on your permission model
      const allGroups = await IafProj.getUserGroups(project, ctx)
      const adminGroup = allGroups.find(ug => ug._name === 'Admin' || ug.permissions?.accessAll)
      if (adminGroup && userGroupsResult?.some(ug => ug._id === adminGroup._id)) {
        setIsAdmin(true)
      }
    } catch (err) {
      console.error('Failed to load user groups:', err)
    }
  }

  const handleSwitchUserGroup = async (userGroupId) => {
    try {
      if (!currentProject) return
      
      // Store preference
      localStorage.setItem(`userGroup_${currentProject._id}`, userGroupId)
      const selectedGroup = userGroups.find(ug => ug._id === userGroupId)
      setCurrentUserGroup(selectedGroup)
      setUserPanelOpen(false)
      
      // Note: Actual user group switching may require additional API calls
      // This depends on how your platform handles user group context
      console.log('Switched to user group:', selectedGroup)
    } catch (err) {
      console.error('Failed to switch user group:', err)
      setError(`Failed to switch user group: ${err.message || 'Unknown error'}`)
    }
  }

  const loadAllProjectUserGroups = async () => {
    try {
      if (!currentProject) return
      
      setLoadingUserGroups(true)
      const authToken = await IafSession.getAuthToken()
      const ctx = {
        _namespaces: currentProject._namespaces || [],
        authToken: authToken
      }

      // Get all user groups for the project (not just current user's groups)
      const allGroups = await IafProj.getUserGroups(currentProject, ctx)
      
      if (allGroups && Array.isArray(allGroups)) {
        setAllProjectUserGroups(allGroups)
        console.log('All project user groups:', allGroups)
      } else {
        setAllProjectUserGroups([])
      }
    } catch (err) {
      console.error('Failed to load all user groups:', err)
      setError(`Failed to load user groups: ${err.message || 'Unknown error'}`)
      setAllProjectUserGroups([])
    } finally {
      setLoadingUserGroups(false)
    }
  }

  const handleOpenUserGroupManagement = () => {
    setUserPanelOpen(false)
    setUserGroupModalOpen(true)
    setSelectedGroupForDetails(null)
    setGroupUsers({})
    setGroupInvites({})
    setShowInviteForm(false)
    loadAllProjectUserGroups()
  }

  // Panel handlers - close other panels when opening a new one
  const handleNotificationPanelToggle = () => {
    const newState = !notificationPanelOpen
    setNotificationPanelOpen(newState)
    if (newState) {
      setUserPanelOpen(false)
      setAppSwitcherOpen(false)
    }
  }

  const handleUserPanelToggle = () => {
    const newState = !userPanelOpen
    setUserPanelOpen(newState)
    if (newState) {
      setNotificationPanelOpen(false)
      setAppSwitcherOpen(false)
    }
  }

  const handleAppSwitcherToggle = () => {
    const newState = !appSwitcherOpen
    setAppSwitcherOpen(newState)
    if (newState) {
      setNotificationPanelOpen(false)
      setUserPanelOpen(false)
    }
  }

  const loadGroupUsers = async (userGroup) => {
    try {
      setLoadingGroupDetails(true)
      const authToken = await IafSession.getAuthToken()
      const ctx = {
        _namespaces: currentProject._namespaces || [],
        authToken: authToken
      }

      const users = await IafUserGroup.getUsers(userGroup, null, {
        _offset: 0,
        _pageSize: 200,
      })

      if (users && Array.isArray(users)) {
        setGroupUsers(prev => ({
          ...prev,
          [userGroup._id]: users.sort((a, b) => {
            const aName = `${a._lastname || ''} ${a._firstname || ''}`.trim()
            const bName = `${b._lastname || ''} ${b._firstname || ''}`.trim()
            return aName.localeCompare(bName)
          })
        }))
      }
    } catch (err) {
      console.error('Failed to load group users:', err)
      setError(`Failed to load users: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingGroupDetails(false)
    }
  }

  const loadGroupInvites = async (userGroup) => {
    try {
      const authToken = await IafSession.getAuthToken()
      const ctx = {
        _namespaces: currentProject._namespaces || [],
        authToken: authToken
      }

      const invitesResult = await IafUserGroup.getInvites(userGroup)
      
      if (invitesResult && invitesResult._list) {
        const pending = invitesResult._list.filter(i => i._status === 'PENDING')
        const expired = invitesResult._list.filter(i => i._status === 'EXPIRED')
        
        setGroupInvites(prev => ({
          ...prev,
          [userGroup._id]: { pending, expired }
        }))
      }
    } catch (err) {
      console.error('Failed to load group invites:', err)
      setError(`Failed to load invites: ${err.message || 'Unknown error'}`)
    }
  }

  const handleSelectGroupForDetails = async (userGroup) => {
    setSelectedGroupForDetails(userGroup)
    if (!groupUsers[userGroup._id]) {
      await loadGroupUsers(userGroup)
    }
    if (!groupInvites[userGroup._id]) {
      await loadGroupInvites(userGroup)
    }
  }

  const validateEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email.toLowerCase())
  }

  const handleAddInviteEmail = () => {
    setEmailError(null)
    const email = currentInviteEmail.trim().toLowerCase()

    if (!email) {
      setEmailError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Invalid email address')
      return
    }

    // Check if email already in list
    if (inviteEmails.some(e => e._email === email)) {
      setEmailError('Email already added')
      return
    }

    setInviteEmails([...inviteEmails, { _email: email }])
    setCurrentInviteEmail('')
  }

  const handleRemoveInviteEmail = (emailToRemove) => {
    setInviteEmails(inviteEmails.filter(e => e._email !== emailToRemove))
  }

  const handleSendInvites = async () => {
    if (inviteEmails.length === 0 || selectedGroupsForInvite.length === 0) {
      setError('Please select at least one user group and add at least one email')
      return
    }

    try {
      setSendingInvites(true)
      setError(null)

      const authToken = await IafSession.getAuthToken()
      const ctx = {
        _namespaces: currentProject._namespaces || [],
        authToken: authToken
      }

      // Prepare invite data
      const params = {
        base_url: endPointConfig?.baseRoot || defaultEndPointConfig.baseRoot,
        invite_link: `${window.location.origin}${window.location.pathname}`,
        type: 'Project',
        name: currentProject._name,
        inviter_name: currentUser ? `${currentUser._firstname || ''} ${currentUser._lastname || ''}`.trim() : 'User',
        body_header: 'Twinit Carbon App',
        body_content: `${currentUser ? `${currentUser._firstname || ''} ${currentUser._lastname || ''}`.trim() : 'A user'} has invited you to join the Project ${currentProject._name}.`,
        subject: `Invitation to join ${currentProject._name}`
      }

      const inviteData = inviteEmails.map(e => ({
        _email: e._email,
        _params: params
      }))

      // Send invites to each selected group (sequentially to avoid backend errors)
      for (const group of selectedGroupsForInvite) {
        await IafUserGroup.inviteUsersToGroup(group, inviteData)
      }

      // Refresh invites for selected groups
      for (const group of selectedGroupsForInvite) {
        await loadGroupInvites(group)
      }

      // Reset form
      setInviteEmails([])
      setSelectedGroupsForInvite([])
      setCurrentInviteEmail('')
      setShowInviteForm(false)

      console.log(`Sent ${inviteData.length} invite(s) to ${selectedGroupsForInvite.length} group(s)`)
    } catch (err) {
      console.error('Failed to send invites:', err)
      setError(`Failed to send invites: ${err.message || 'Unknown error'}`)
    } finally {
      setSendingInvites(false)
    }
  }

  const handleSwitchProject = async (projectId) => {
    try {
      setIsLoading(true)
      setError(null)

      const selectedProject = projects.find(p => p._id === projectId)
      if (!selectedProject) {
        setError('Project not found')
        return
      }

      // Switch project using IafProj.switchProject
      const switchedProject = await IafProj.switchProject(selectedProject._id)
      setCurrentProject(switchedProject)
      
      // Clear previous collections and items
      setCollections([])
      setCollectionItems([])
      setSelectedCollection(null)
      
      // Load collections and user groups for new project
      await loadCollections(switchedProject)
      await loadUserGroups(switchedProject)
      
      setAppSwitcherOpen(false)
      console.log('Switched to project:', switchedProject)
    } catch (err) {
      console.error('Failed to switch project:', err)
      setError(`Failed to switch project: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadProjects = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)
      
      // Load projects with pagination
      let allProjects = []
      let pageSize = 20
      let offset = 0
      let total = 0

      do {
        const projPage = await IafProj.getProjectsWithPagination(null, null, {
          _pageSize: pageSize,
          _offset: offset
        })
        
        total = projPage._total || 0
        offset += pageSize
        
        if (projPage._list) {
          allProjects.push(...projPage._list)
        }
      } while (allProjects.length < total)

      // Sort projects by name
      allProjects.sort((a, b) => {
        const nameA = a._name || ''
        const nameB = b._name || ''
        return nameA.localeCompare(nameB)
      })

      setProjects(allProjects)
      console.log('Loaded projects:', allProjects.length)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError(`Failed to load projects: ${err.message || 'Authentication may be required'}`)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const handleSelectProject = async (projectId, showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)

      const selectedProject = projects.find(p => p._id === projectId)
      if (!selectedProject) {
        setError('Project not found')
        return
      }

      // Set the selected project as current using setupCurrent
      const setupProject = await IafProj.setupCurrent(selectedProject)
      setCurrentProject(setupProject)
      
      // Clear previous collections and items
      setCollections([])
      setCollectionItems([])
      setSelectedCollection(null)
      
      // Load collections for the selected project
      await loadCollections(setupProject)
      
      // Load user groups for the project
      await loadUserGroups(setupProject)
      
      // Hide project selection page if it was shown
      setShowProjectSelection(false)
      
      console.log('Selected project:', setupProject)
    } catch (err) {
      console.error('Failed to select project:', err)
      setError(`Failed to select project: ${err.message || 'Unknown error'}`)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const loadCollections = async (project) => {
    try {
      setLoadingCollections(true)
      setError(null)

      // Get auth token for context
      const authToken = await IafSession.getAuthToken()
      
      // Create context with project namespaces and auth token
      // Per docs: ctx should have _namespaces array and authToken
      const ctx = {
        _namespaces: project._namespaces || [],
        authToken: authToken || undefined // Optional, but include if available
      }

      console.log('Loading collections for project:', project._name)
      console.log('Context namespaces:', ctx._namespaces)
      console.log('Has auth token:', !!authToken)

      // Use getNamedUserItems (returns {_list, _total}) instead of getAllNamedUserItems
      // Per docs: getNamedUserItems({query}, context, options) returns {_list: [], _total: number}
      const allCollections = []

      // Try to get NamedUserCollection
      try {
        const userCollections = await IafItemSvc.getNamedUserItems({
          query: {
            _itemClass: 'NamedUserCollection',
            _namespaces: { $in: ctx._namespaces }
          }
        }, ctx, {
          page: {
            _pageSize: 1000
          }
        })
        // Response format: { _list: [...], _total: number }
        if (userCollections && Array.isArray(userCollections._list) && userCollections._list.length > 0) {
          allCollections.push(...userCollections._list)
          console.log('Found NamedUserCollection:', userCollections._list.length, 'total:', userCollections._total)
        }
      } catch (err) {
        console.warn('Error loading NamedUserCollection:', err)
      }

      // Try to get NamedFileCollection
      try {
        const fileCollections = await IafItemSvc.getNamedUserItems({
          query: {
            _itemClass: 'NamedFileCollection',
            _namespaces: { $in: ctx._namespaces }
          }
        }, ctx, {
          page: {
            _pageSize: 1000
          }
        })
        if (fileCollections && Array.isArray(fileCollections._list) && fileCollections._list.length > 0) {
          allCollections.push(...fileCollections._list)
          console.log('Found NamedFileCollection:', fileCollections._list.length, 'total:', fileCollections._total)
        }
      } catch (err) {
        console.warn('Error loading NamedFileCollection:', err)
      }

      // Try to get NamedCompositeItem
      try {
        const compositeItems = await IafItemSvc.getNamedUserItems({
          query: {
            _itemClass: 'NamedCompositeItem',
            _namespaces: { $in: ctx._namespaces }
          }
        }, ctx, {
          page: {
            _pageSize: 1000
          }
        })
        if (compositeItems && Array.isArray(compositeItems._list) && compositeItems._list.length > 0) {
          allCollections.push(...compositeItems._list)
          console.log('Found NamedCompositeItem:', compositeItems._list.length, 'total:', compositeItems._total)
        }
      } catch (err) {
        console.warn('Error loading NamedCompositeItem:', err)
      }

      // Try to get NamedTelemetryCollection (for telemetry data)
      try {
        const telemetryCollections = await IafItemSvc.getNamedUserItems({
          query: {
            _itemClass: 'NamedTelemetryCollection',
            _namespaces: { $in: ctx._namespaces }
          }
        }, ctx, {
          page: {
            _pageSize: 1000
          }
        })
        if (telemetryCollections && Array.isArray(telemetryCollections._list) && telemetryCollections._list.length > 0) {
          allCollections.push(...telemetryCollections._list)
          console.log('Found NamedTelemetryCollection:', telemetryCollections._list.length, 'total:', telemetryCollections._total)
        }
      } catch (err) {
        console.warn('Error loading NamedTelemetryCollection:', err)
      }

      // If still no collections, try without itemClass filter (just namespace filter)
      if (allCollections.length === 0) {
        try {
          const allItems = await IafItemSvc.getNamedUserItems({
            query: {
              _namespaces: { $in: ctx._namespaces }
            }
          }, ctx, {
            page: {
              _pageSize: 1000
            }
          })
          // Response format: { _list: [...], _total: number }
          if (allItems && Array.isArray(allItems._list) && allItems._list.length > 0) {
            allCollections.push(...allItems._list)
            console.log('Found all items (no itemClass filter):', allItems._list.length, 'total:', allItems._total)
          }
        } catch (err) {
          console.warn('Error loading all items:', err)
        }
      }

      if (allCollections.length > 0) {
        setCollections(allCollections)
        console.log('Total collections loaded:', allCollections.length)
        console.log('Collections:', allCollections)
      } else {
        console.warn('No collections found. This might be a permissions issue or the project has no collections.')
        console.warn('Project namespaces:', ctx._namespaces)
        setCollections([])
        // Don't set error, just show empty state
      }
    } catch (err) {
      console.error('Failed to load collections:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      setError(`Failed to load collections: ${err.message || 'Unknown error'}. Check console for details.`)
      setCollections([])
    } finally {
      setLoadingCollections(false)
    }
  }

  const handleSelectCollection = async (collectionId) => {
    try {
      setLoadingItems(true)
      setError(null)

      const collection = collections.find(c => c._id === collectionId)
      if (!collection) {
        setError('Collection not found')
        return
      }

      setSelectedCollection(collection)
      // Reset pagination and sorting when selecting a new collection
      setFirstRowIndex(0)
      setCurrentPageSize(10)
      setSortColumn(null)
      setSortDirection(null)

      // Get auth token for context
      const authToken = await IafSession.getAuthToken()
      
      // Create context with project namespaces and auth token
      const ctx = {
        _namespaces: currentProject._namespaces || [],
        authToken: authToken
      }

      // Get items in the collection
      const itemsResult = await IafItemSvc.getRelatedItems(collection._id, {}, ctx, {
        page: {
          _pageSize: 1000
        }
      })

      if (itemsResult && itemsResult._list) {
        setCollectionItems(itemsResult._list)
        console.log('Loaded collection items:', itemsResult._list)
      } else {
        setCollectionItems([])
      }
    } catch (err) {
      console.error('Failed to load collection items:', err)
      setError(`Failed to load items: ${err.message || 'Unknown error'}`)
    } finally {
      setLoadingItems(false)
    }
  }

  const loadTelemetryReadings = async (telemetryItem, collectionId, dateRange = null) => {
    try {
      const itemId = telemetryItem._id || telemetryItem._userItemId
      if (!itemId) return

      // Set loading state
      setExpandedTelemetryItems(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], loading: true }
      }))

      const authToken = await IafSession.getAuthToken()
      const ctx = {
        _namespaces: currentProject._namespaces || [],
        authToken: authToken
      }

      // Get readings for this specific telemetry item using _sourceId or _telItemId
      const sourceId = telemetryItem._sourceId || telemetryItem._id
      
      // Build query criteria
      let queryCriteria = {}
      if (sourceId) {
        queryCriteria["_tsMetadata._sourceId"] = sourceId
      }
      
      // Add date range filter if provided
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        try {
          // Combine date and time for start
          const startDateTime = new Date(`${dateRange.startDate}T${dateRange.startTime || '00:00'}`)
          // Combine date and time for end
          const endDateTime = new Date(`${dateRange.endDate}T${dateRange.endTime || '23:59'}`)
          
          // Add timestamp range to query
          queryCriteria._ts = {
            $gte: startDateTime.toISOString(),
            $lte: endDateTime.toISOString()
          }
        } catch (e) {
          console.warn('Invalid date range, ignoring:', e)
        }
      }
      
      const criteria = Object.keys(queryCriteria).length > 0 ? {
        query: queryCriteria
      } : undefined

      // Determine page size based on whether date range is used
      const pageSize = dateRange && dateRange.startDate && dateRange.endDate ? 1000 : 10

      // Get readings sorted by timestamp descending
      const readingsResult = await IafItemSvc.getRelatedReadingItems(
        collectionId,
        criteria,
        ctx,
        {
          sort: { '_ts': -1 },
          page: { _pageSize: pageSize }
        }
      )

      // Log the response for debugging
      console.log('Telemetry readings response:', readingsResult)
      console.log('Readings for item:', telemetryItem._name || telemetryItem._sourceId, readingsResult)

      let readings = readingsResult && readingsResult._list ? readingsResult._list : []
      
      // If date range is used, filter client-side as well (in case API doesn't support it fully)
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        try {
          const startDateTime = new Date(`${dateRange.startDate}T${dateRange.startTime || '00:00'}`)
          const endDateTime = new Date(`${dateRange.endDate}T${dateRange.endTime || '23:59'}`)
          
          readings = readings.filter(reading => {
            if (!reading._ts) return false
            const readingDate = new Date(reading._ts)
            return readingDate >= startDateTime && readingDate <= endDateTime
          })
        } catch (e) {
          console.warn('Error filtering readings by date range:', e)
        }
      }

      // Check if readings are numeric
      const isNumeric = isReadingNumeric(readings)
      
      setExpandedTelemetryItems(prev => ({
        ...prev,
        [itemId]: { readings, loading: false, isNumeric }
      }))
      
      // Update aggregation state to track if readings are numeric
      setTelemetryAggregation(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], isNumeric }
      }))
    } catch (err) {
      console.error('Failed to load telemetry readings:', err)
      setExpandedTelemetryItems(prev => ({
        ...prev,
        [telemetryItem._id || telemetryItem._userItemId]: { readings: [], loading: false, error: err.message }
      }))
    }
  }

  const toggleTelemetryItemExpansion = (item) => {
    const itemId = item._id || item._userItemId
    const isExpanded = expandedTelemetryItems[itemId]?.readings !== undefined

    if (isExpanded) {
      // Collapse - remove from state
      setExpandedTelemetryItems(prev => {
        const newState = { ...prev }
        delete newState[itemId]
        return newState
      })
    } else {
      // Expand - load readings
      loadTelemetryReadings(item, selectedCollection._id || selectedCollection._userItemId)
    }
  }

  // Helper function to extract value from item by key pattern (case-insensitive)
  const getItemValueByKeyPattern = (item, pattern) => {
    const lowerPattern = pattern.toLowerCase()
    for (const key in item) {
      if (key.toLowerCase().includes(lowerPattern)) {
        return item[key]
      }
    }
    return null
  }

  // Helper function to get all key-value pairs matching a pattern
  const getItemKeyValuePairsByPattern = (item, pattern) => {
    const lowerPattern = pattern.toLowerCase()
    const matches = []
    for (const key in item) {
      if (key.toLowerCase().includes(lowerPattern)) {
        // Skip metadata and prototype keys
        if (!key.startsWith('_metadata') && 
            !key.startsWith('_prototype') && 
            key !== 'metadata' && 
            key !== 'prototype' &&
            key !== '__proto__' &&
            key !== 'constructor') {
          matches.push({ key, value: item[key] })
        }
      }
    }
    return matches
  }

  // Helper function to convert readings to Carbon Charts format
  const convertReadingsToChartData = (readings, isAggregated, telemetryItem = null) => {
    if (!readings || readings.length === 0) {
      return {
        data: [],
        options: {}
      }
    }

    // Sort readings by timestamp (ascending for chart)
    const sortedReadings = [...readings].sort((a, b) => {
      const tsA = new Date(a._ts || a._id || 0).getTime()
      const tsB = new Date(b._ts || b._id || 0).getTime()
      return tsA - tsB
    })

    if (isAggregated) {
      // For aggregated data, show average, min, and max as separate series
      const avgData = sortedReadings.map(reading => {
        const ts = new Date(reading._ts || reading._id)
        return {
          group: 'Average',
          key: ts.toISOString(),
          value: reading.avg !== null && reading.avg !== undefined ? Number(reading.avg) : null
        }
      }).filter(d => d.value !== null)

      const minData = sortedReadings.map(reading => {
        const ts = new Date(reading._ts || reading._id)
        return {
          group: 'Min',
          key: ts.toISOString(),
          value: reading.min !== null && reading.min !== undefined ? Number(reading.min) : null
        }
      }).filter(d => d.value !== null)

      const maxData = sortedReadings.map(reading => {
        const ts = new Date(reading._ts || reading._id)
        return {
          group: 'Max',
          key: ts.toISOString(),
          value: reading.max !== null && reading.max !== undefined ? Number(reading.max) : null
        }
      }).filter(d => d.value !== null)

      // Get navName and unit from telemetry item
      let navName = ''
      let unit = ''
      if (telemetryItem) {
        navName = getItemDisplayName(telemetryItem, true)
        unit = getItemValueByKeyPattern(telemetryItem, 'unit') || ''
      }
      
      const title = navName ? `Aggregated Telemetry Reading for ${navName}` : 'Aggregated Telemetry Readings'
      const yAxisTitle = unit ? `Value (${unit})` : 'Value'
      
      return {
        data: [...avgData, ...minData, ...maxData],
        options: {
          title: title,
          axes: {
            bottom: {
              title: 'Time',
              mapsTo: 'key',
              scaleType: 'time',
              ticks: {
                rotation: -45
              }
            },
            left: {
              title: yAxisTitle,
              mapsTo: 'value',
              scaleType: 'linear'
            }
          },
          height: '400px',
          curve: 'curveMonotoneX',
          color: {
            scale: {
              'Average': '#0f62fe',
              'Min': '#24a148',
              'Max': '#da1e28'
            }
          },
          theme: 'g100',
          backgroundColor: '#262626'
        }
      }
    } else {
      // For regular readings, show single value series
      const chartData = sortedReadings.map(reading => {
        const ts = new Date(reading._ts || reading._id)
        const value = getReadingValue(reading)
        const numValue = value !== null && value !== undefined 
          ? (typeof value === 'string' ? parseFloat(value) : Number(value))
          : null
        
        if (isNaN(numValue) || !isFinite(numValue)) {
          return null
        }

        return {
          group: 'Value',
          key: ts.toISOString(),
          value: numValue
        }
      }).filter(d => d !== null)

      return {
        data: chartData,
        options: {
          title: 'Telemetry Readings',
          axes: {
            bottom: {
              title: 'Time',
              mapsTo: 'key',
              scaleType: 'time',
              ticks: {
                rotation: -45
              }
            },
            left: {
              title: 'Value',
              mapsTo: 'value',
              scaleType: 'linear'
            }
          },
          height: '400px',
          curve: 'curveMonotoneX',
          color: {
            scale: {
              'Value': '#0f62fe'
            }
          },
          theme: 'g100',
          backgroundColor: '#262626'
        }
      }
    }
  }

  // Get reading value by searching for keys containing "value", "val", or "reading"
  const getReadingValue = (reading) => {
    if (!reading || typeof reading !== 'object') {
      return null
    }
    
    // Search for keys containing "value", "val", or "reading" (case-insensitive)
    const patterns = ['value', 'val', 'reading']
    
    for (const pattern of patterns) {
      const value = getItemValueByKeyPattern(reading, pattern)
      if (value !== null && value !== undefined) {
        return value
      }
    }
    
    return null
  }

  // Helper function to check if a reading value is numeric
  const isReadingNumeric = (readings) => {
    if (!readings || readings.length === 0) return false
    
    // Check first few readings to determine if values are numeric
    const sampleSize = Math.min(10, readings.length)
    let numericCount = 0
    
    for (let i = 0; i < sampleSize; i++) {
      const value = getReadingValue(readings[i])
      if (value !== null && value !== undefined) {
        // Check if value is a number (including string numbers)
        const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)
        if (!isNaN(numValue) && isFinite(numValue)) {
          numericCount++
        }
      }
    }
    
    // Consider numeric if at least 50% of sample readings are numeric
    return numericCount >= sampleSize * 0.5
  }

  // Load aggregated telemetry readings using server-side aggregation (Twinit API)
  const loadAggregatedTelemetryReadingsServer = async (telemetryItem, collectionId, period, dateRange = null) => {
    try {
      const itemId = telemetryItem._id || telemetryItem._userItemId
      if (!itemId) return

      // Set loading state
      setExpandedTelemetryItems(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], loading: true }
      }))

      const authToken = await IafSession.getAuthToken()
      const ctx = {
        _namespaces: currentProject._namespaces || [],
        authToken: authToken
      }

      const sourceId = telemetryItem._sourceId || telemetryItem._id
      
      // Build match criteria
      let matchCriteria = {}
      if (sourceId) {
        matchCriteria["_tsMetadata._sourceId"] = sourceId
      }
      
      // Add date range filter if provided
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        try {
          const startDateTime = new Date(`${dateRange.startDate}T${dateRange.startTime || '00:00'}`)
          const endDateTime = new Date(`${dateRange.endDate}T${dateRange.endTime || '23:59'}`)
          
          matchCriteria._ts = {
            $gte: startDateTime.toISOString(),
            $lte: endDateTime.toISOString()
          }
        } catch (e) {
          console.warn('Invalid date range, ignoring:', e)
        }
      }

      // Determine time unit and binSize for $dateTrunc based on period
      let unit = 'hour'
      let binSize = 1
      let dateFormat = '%Y-%m-%dT%H:00:00.000Z' // ISO format for hour
      
      if (period === 'hour') {
        unit = 'hour'
        binSize = 1
        dateFormat = '%Y-%m-%dT%H:00:00.000Z'
      } else if (period === '3hours') {
        unit = 'hour'
        binSize = 3
        dateFormat = '%Y-%m-%dT%H:00:00.000Z'
      } else if (period === 'day') {
        unit = 'day'
        binSize = 1
        dateFormat = '%Y-%m-%dT00:00:00.000Z'
      } else if (period === 'week') {
        unit = 'week'
        binSize = 1
        dateFormat = '%Y-%m-%dT00:00:00.000Z'
      } else if (period === 'month') {
        unit = 'month'
        binSize = 1
        dateFormat = '%Y-%m-01T00:00:00.000Z'
      }

      // First, get a sample reading to determine the value field name
      let valueField = 'value' // default
      try {
        const sampleCriteria = sourceId ? {
          query: { "_tsMetadata._sourceId": sourceId }
        } : undefined
        const sampleResult = await IafItemSvc.getRelatedReadingItems(
          collectionId,
          sampleCriteria,
          ctx,
          { page: { _pageSize: 1 } }
        )
        if (sampleResult && sampleResult._list && sampleResult._list.length > 0) {
          const sampleReading = sampleResult._list[0]
          if (sampleReading.value !== undefined) {
            valueField = 'value'
          } else if (sampleReading.val !== undefined) {
            valueField = 'val'
          } else if (sampleReading.reading !== undefined) {
            valueField = 'reading'
          }
        }
      } catch (e) {
        console.warn('Could not determine value field, using default "value":', e)
      }

      // Build aggregation pipeline using $dateTrunc (following documentation pattern)
      // Step 1: $match - filter readings
      // Step 2: $project - create bucket timestamp using $dateTrunc and format with $dateToString
      // Step 3: $group - aggregate by bucket timestamp
      // Step 4: $project - format output
      // Step 5: $sort - sort by timestamp
      const aggregations = [
        {
          $match: matchCriteria
        },
        {
          $project: {
            tsAsBucket: {
              $dateToString: {
                format: dateFormat,
                date: {
                  $dateTrunc: {
                    date: "$_ts",
                    unit: unit,
                    binSize: binSize
                  }
                }
              }
            },
            "_ts": 1,
            [valueField]: 1
          }
        },
        {
          $group: {
            _id: "$tsAsBucket",
            avg: { $avg: `$${valueField}` },
            min: { $min: `$${valueField}` },
            max: { $max: `$${valueField}` },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _ts: "$_id",
            avg: 1,
            min: 1,
            max: 1,
            count: 1
          }
        },
        {
          $sort: { _ts: -1 }
        }
      ]

      console.log('Server-side aggregation pipeline:', JSON.stringify(aggregations, null, 2))

      // Call aggregateReadings API
      const aggregatedResult = await IafItemSvc.aggregateReadings(
        collectionId,
        aggregations,
        ctx,
        undefined
      )

      console.log('Server-side aggregated readings response:', aggregatedResult)

      let aggregatedReadings = aggregatedResult && aggregatedResult._list ? aggregatedResult._list : []

      setExpandedTelemetryItems(prev => ({
        ...prev,
        [itemId]: { 
          ...prev[itemId],
          readings: aggregatedReadings, 
          loading: false, 
          aggregated: true, 
          period,
          aggregationMethod: 'server'
        }
      }))
    } catch (err) {
      console.error('Failed to load server-side aggregated telemetry readings:', err)
      const itemId = telemetryItem._id || telemetryItem._userItemId
      setExpandedTelemetryItems(prev => ({
        ...prev,
        [itemId]: { 
          ...prev[itemId],
          loading: false, 
          error: `Server-side aggregation failed: ${err.message}`
        }
      }))
    }
  }

  // Helper function to get display name for an item
  const getItemDisplayName = (item, isTelemetry = false) => {
    // First try to find a key containing "name" (case-insensitive)
    let nameValue = getItemValueByKeyPattern(item, 'name')
    
    // For telemetry, if no name found, try "desc"
    if (!nameValue && isTelemetry) {
      nameValue = getItemValueByKeyPattern(item, 'desc')
    }
    
    // Fallback to standard fields
    if (!nameValue) {
      nameValue = item._name || item._shortName || item.name || item.Name || 'Unnamed'
    }
    
    return nameValue
  }

  // Helper function to filter out metadata and prototype keys
  const getFilteredItemProperties = (item) => {
    const filtered = {}
    const excludeKeys = ['_metadata', '_prototype', '__proto__', 'constructor']
    
    for (const key in item) {
      // Skip if key starts with _metadata or _prototype, or is in exclude list
      if (key.startsWith('_metadata') || 
          key.startsWith('_prototype') || 
          excludeKeys.includes(key) ||
          key === 'metadata' ||
          key === 'prototype') {
        continue
      }
      filtered[key] = item[key]
    }
    
    return filtered
  }

  // Handle column sorting
  const handleSort = (column) => {
    console.log('handleSort called with column:', column)
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        console.log('Changing from asc to desc')
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        console.log('Changing from desc to null (no sort)')
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      // New column selected, start with ascending
      console.log('New column selected, setting to asc')
      setSortColumn(column)
      setSortDirection('asc')
    }
    // Reset pagination when sorting changes
    setFirstRowIndex(0)
  }

  // Get sorted collection items
  const getSortedItems = (items, isTelemetry) => {
    if (!sortColumn || !sortDirection) {
      return items
    }

    return [...items].sort((a, b) => {
      let aValue, bValue

      if (sortColumn === 'name') {
        // For name, use first matching key-value pair for sorting
        const aPairs = getItemKeyValuePairsByPattern(a, 'name')
        const bPairs = getItemKeyValuePairsByPattern(b, 'name')
        aValue = aPairs.length > 0 ? aPairs[0].value : getItemDisplayName(a, isTelemetry)
        bValue = bPairs.length > 0 ? bPairs[0].value : getItemDisplayName(b, isTelemetry)
      } else if (sortColumn === 'equip') {
        // For equip, use first matching key-value pair for sorting
        const aPairs = getItemKeyValuePairsByPattern(a, 'equip')
        const bPairs = getItemKeyValuePairsByPattern(b, 'equip')
        aValue = aPairs.length > 0 ? aPairs[0].value : null
        bValue = bPairs.length > 0 ? bPairs[0].value : null
      } else if (sortColumn === 'desc') {
        // For desc, use first matching key-value pair for sorting
        const aPairs = getItemKeyValuePairsByPattern(a, 'desc')
        const bPairs = getItemKeyValuePairsByPattern(b, 'desc')
        aValue = aPairs.length > 0 ? aPairs[0].value : null
        bValue = bPairs.length > 0 ? bPairs[0].value : null
      } else if (sortColumn === 'kind') {
        aValue = getItemValueByKeyPattern(a, 'kind')
        bValue = getItemValueByKeyPattern(b, 'kind')
      } else if (sortColumn === 'unit') {
        aValue = getItemValueByKeyPattern(a, 'unit')
        bValue = getItemValueByKeyPattern(b, 'unit')
      } else {
        return 0
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''

      // Convert to strings for comparison
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      let comparison = 0
      if (aStr < bStr) {
        comparison = -1
      } else if (aStr > bStr) {
        comparison = 1
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  // Get sort icon for a column
  const getSortIcon = (column) => {
    const iconStyle = { pointerEvents: 'none' } // Allow clicks to pass through to parent
    if (sortColumn !== column) {
      return <ArrowsVertical size={16} style={iconStyle} />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={16} style={iconStyle} />
    }
    if (sortDirection === 'desc') {
      return <ArrowDown size={16} style={iconStyle} />
    }
    return <ArrowsVertical size={16} style={iconStyle} />
  }

  const toggleItemExpansion = (itemId, item, isTelemetry) => {
    const isCurrentlyExpanded = expandedItems[itemId] || false
    
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !isCurrentlyExpanded
    }))
    
    // For telemetry items, load readings when expanding for the first time
    if (isTelemetry && !isCurrentlyExpanded && selectedCollection) {
      const telemetryItemId = item._id || item._userItemId
      const isReadingsExpanded = expandedTelemetryItems[telemetryItemId]?.readings !== undefined
      
      if (!isReadingsExpanded) {
        // Use date range if enabled
        const dateRange = useDateRange && startDate && endDate ? {
          startDate,
          startTime,
          endDate,
          endTime
        } : null
        loadTelemetryReadings(item, selectedCollection._id || selectedCollection._userItemId, dateRange)
      }
    }
  }

  // Table headers for project list
  const headers = [
    { key: 'name', header: 'Project Name' },
    { key: 'id', header: 'Project ID' },
    { key: 'namespaces', header: 'Namespaces' },
  ]

  // Format projects for table
  const rows = projects.map(project => ({
    id: project._id,
    name: project._name || 'Unnamed',
    id_value: project._id,
    namespaces: project._namespaces ? project._namespaces.join(', ') : 'None',
    project: project, // Store full project object
  }))

  const handleLogout = async () => {
    try {
      const authToken = await IafSession.getAuthToken()
      const ctx = { authToken }
      await IafPassSvc.logout(ctx)
    } catch (err) {
      console.error('Logout error:', err)
    }
    localStorage.removeItem('twinit_token')
    localStorage.removeItem('twinit_env')
    setIsAuthenticated(false)
    setIsConnected(false)
    setProjects([])
    setCurrentProject(null)
    setCurrentUser(null)
    setUserGroups([])
    setCurrentUserGroup(null)
    window.location.reload()
  }

  const getUserProfileUrl = () => {
    const env = endPointConfig?.passportServiceOrigin || defaultEndPointConfig.passportServiceOrigin
    // Use the correct accounts endpoint with continue parameter
    return `${env}/passportsvc/api/accounts?continue`
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser) return 'U'
    const first = currentUser._firstname?.[0] || ''
    const last = currentUser._lastname?.[0] || ''
    return `${first}${last}`.toUpperCase() || 'U'
  }

  // Render telemetry page content
  const renderTelemetryPage = () => {
    // Check if a telemetry collection is selected
    const isTelemetryCollection = selectedCollection?._itemClass === 'NamedTelemetryCollection'
    
    if (!isTelemetryCollection) {
      return (
        <>
          <Column lg={16} md={8} sm={4} className="app-header">
            <h1>Telemetry</h1>
            <p>Please select a telemetry collection on the home page to view telemetry data</p>
          </Column>
          <Column lg={16} md={8} sm={4}>
            <Tile>
              <h3>No Telemetry Collection Selected</h3>
              <p>To view telemetry data, please go to the Home page and select a telemetry collection.</p>
              <Button 
                onClick={() => setCurrentPage('home')}
                style={{ marginTop: '1rem' }}
              >
                Go to Home Page
              </Button>
            </Tile>
          </Column>
        </>
      )
    }

    // Display the telemetry table (same as home page)
    return (
      <>
        <Column lg={16} md={8} sm={4} className="app-header">
          <h1>Telemetry: {selectedCollection._name || selectedCollection._shortName || 'Unnamed'}</h1>
          <p>{selectedCollection._description || 'Telemetry collection data'}</p>
        </Column>

        {/* Date/Time Range Filter */}
        <Column lg={16} md={8} sm={4}>
          <Tile>
            <h3>Date/Time Range Filter</h3>
            <div style={{ marginTop: '1rem' }}>
              <Checkbox
                id="use-date-range"
                labelText="Use date/time range filter"
                checked={useDateRange}
                onChange={(event, { checked }) => {
                  setUseDateRange(checked)
                  if (!checked) {
                    // Clear date range and reload readings with default (last 10)
                    setExpandedTelemetryItems({})
                  }
                }}
              />
              
              {useDateRange && (
                <>
                  <div style={{ marginTop: '1rem' }}>
                    <Select
                      id="predefined-duration"
                      labelText="Quick Select Duration (optional)"
                      value={predefinedDuration}
                      onChange={(event) => {
                        const duration = event.target?.value || event.selectedItem?.value
                        setPredefinedDuration(duration)
                        
                        if (duration) {
                          const now = new Date()
                          let startDateTime = new Date()
                          
                          // Calculate start date/time based on duration
                          switch (duration) {
                            case 'last-hour':
                              startDateTime = new Date(now.getTime() - 60 * 60 * 1000)
                              break
                            case 'last-day':
                              startDateTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                              break
                            case 'last-week':
                              startDateTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                              break
                            case 'last-month':
                              startDateTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                              break
                            default:
                              return
                          }
                          
                          // Format start date and time
                          const startDateStr = startDateTime.toISOString().split('T')[0]
                          const startTimeStr = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`
                          
                          // Format end date and time (now)
                          const endDateStr = now.toISOString().split('T')[0]
                          const endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                          
                          setStartDate(startDateStr)
                          setStartTime(startTimeStr)
                          setEndDate(endDateStr)
                          setEndTime(endTimeStr)
                        }
                      }}
                      size="md"
                    >
                      <SelectItem value="" text="Select duration..." />
                      <SelectItem value="last-hour" text="Last Hour" />
                      <SelectItem value="last-day" text="Last Day" />
                      <SelectItem value="last-week" text="Last Week" />
                      <SelectItem value="last-month" text="Last Month" />
                    </Select>
                  </div>
                  
                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <DatePicker
                      dateFormat="Y-m-d"
                      datePickerType="single"
                      value={startDate ? [startDate] : []}
                      onChange={(dates) => {
                        if (dates && dates.length > 0) {
                          // Format date as YYYY-MM-DD
                          const date = dates[0]
                          const formattedDate = date instanceof Date 
                            ? date.toISOString().split('T')[0]
                            : date
                          setStartDate(formattedDate)
                          // Clear predefined duration when manually changing date
                          setPredefinedDuration('')
                        } else {
                          setStartDate('')
                        }
                      }}
                    >
                      <DatePickerInput
                        id="start-date"
                        labelText="Start Date"
                        placeholder="yyyy-mm-dd"
                        size="md"
                      />
                    </DatePicker>
                    <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <Select
                        id="start-hour"
                        labelText="Start Hour"
                        value={startTime.split(':')[0] || '00'}
                        onChange={(event) => {
                          const hour = event.target?.value || event.selectedItem?.value
                          const minute = startTime.split(':')[1] || '00'
                          setStartTime(`${hour}:${minute}`)
                          // Clear predefined duration when manually changing time
                          setPredefinedDuration('')
                        }}
                        size="md"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = String(i).padStart(2, '0')
                          return (
                            <SelectItem key={hour} value={hour} text={hour} />
                          )
                        })}
                      </Select>
                      <Select
                        id="start-minute"
                        labelText="Start Minute"
                        value={startTime.split(':')[1] || '00'}
                        onChange={(event) => {
                          const minute = event.target?.value || event.selectedItem?.value
                          const hour = startTime.split(':')[0] || '00'
                          setStartTime(`${hour}:${minute}`)
                          // Clear predefined duration when manually changing time
                          setPredefinedDuration('')
                        }}
                        size="md"
                      >
                        {Array.from({ length: 60 }, (_, i) => {
                          const minute = String(i).padStart(2, '0')
                          return (
                            <SelectItem key={minute} value={minute} text={minute} />
                          )
                        })}
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <DatePicker
                      dateFormat="Y-m-d"
                      datePickerType="single"
                      value={endDate ? [endDate] : []}
                      onChange={(dates) => {
                        if (dates && dates.length > 0) {
                          // Format date as YYYY-MM-DD
                          const date = dates[0]
                          const formattedDate = date instanceof Date 
                            ? date.toISOString().split('T')[0]
                            : date
                          setEndDate(formattedDate)
                          // Clear predefined duration when manually changing date
                          setPredefinedDuration('')
                        } else {
                          setEndDate('')
                        }
                      }}
                    >
                      <DatePickerInput
                        id="end-date"
                        labelText="End Date"
                        placeholder="yyyy-mm-dd"
                        size="md"
                      />
                    </DatePicker>
                    <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <Select
                        id="end-hour"
                        labelText="End Hour"
                        value={endTime.split(':')[0] || '23'}
                        onChange={(event) => {
                          const hour = event.target?.value || event.selectedItem?.value
                          const minute = endTime.split(':')[1] || '59'
                          setEndTime(`${hour}:${minute}`)
                          // Clear predefined duration when manually changing time
                          setPredefinedDuration('')
                        }}
                        size="md"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = String(i).padStart(2, '0')
                          return (
                            <SelectItem key={hour} value={hour} text={hour} />
                          )
                        })}
                      </Select>
                      <Select
                        id="end-minute"
                        labelText="End Minute"
                        value={endTime.split(':')[1] || '59'}
                        onChange={(event) => {
                          const minute = event.target?.value || event.selectedItem?.value
                          const hour = endTime.split(':')[0] || '23'
                          setEndTime(`${hour}:${minute}`)
                          // Clear predefined duration when manually changing time
                          setPredefinedDuration('')
                        }}
                        size="md"
                      >
                        {Array.from({ length: 60 }, (_, i) => {
                          const minute = String(i).padStart(2, '0')
                          return (
                            <SelectItem key={minute} value={minute} text={minute} />
                          )
                        })}
                      </Select>
                    </div>
                  </div>
                </div>
                </>
              )}
              
              {useDateRange && (
                <Button
                  onClick={() => {
                    // Reload all expanded telemetry items with new date range
                    Object.keys(expandedTelemetryItems).forEach(itemId => {
                      const item = collectionItems.find(i => (i._id || i._userItemId) === itemId)
                      if (item) {
                        loadTelemetryReadings(
                          item,
                          selectedCollection._id || selectedCollection._userItemId,
                          {
                            startDate,
                            startTime,
                            endDate,
                            endTime
                          }
                        )
                      }
                    })
                  }}
                  disabled={!startDate || !endDate}
                  style={{ marginTop: '1rem' }}
                >
                  Apply Date/Time Range
                </Button>
              )}
            </div>
          </Tile>
        </Column>

        <Column lg={16} md={8} sm={4}>
          <Tile>
            <h3>Collection Items ({collectionItems.length})</h3>
            {loadingItems ? (
              <Loading description="Loading items..." />
            ) : collectionItems.length > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader style={{ width: '40px' }}></TableHeader>
                        <TableHeader>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Name column clicked')
                              handleSort('name')
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              margin: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              color: 'inherit',
                              font: 'inherit',
                              userSelect: 'none'
                            }}
                          >
                            <span>Name</span>
                            {getSortIcon('name')}
                          </button>
                        </TableHeader>
                        <TableHeader>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Equip column clicked')
                              handleSort('equip')
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              margin: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              color: 'inherit',
                              font: 'inherit',
                              userSelect: 'none'
                            }}
                          >
                            <span>Equip</span>
                            {getSortIcon('equip')}
                          </button>
                        </TableHeader>
                        <TableHeader>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Desc column clicked')
                              handleSort('desc')
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              margin: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              color: 'inherit',
                              font: 'inherit',
                              userSelect: 'none'
                            }}
                          >
                            <span>Desc</span>
                            {getSortIcon('desc')}
                          </button>
                        </TableHeader>
                        <TableHeader>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Kind column clicked')
                              handleSort('kind')
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              margin: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              color: 'inherit',
                              font: 'inherit',
                              userSelect: 'none'
                            }}
                          >
                            <span>Kind</span>
                            {getSortIcon('kind')}
                          </button>
                        </TableHeader>
                        <TableHeader>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Unit column clicked')
                              handleSort('unit')
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              margin: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              color: 'inherit',
                              font: 'inherit',
                              userSelect: 'none'
                            }}
                          >
                            <span>Unit</span>
                            {getSortIcon('unit')}
                          </button>
                        </TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getSortedItems(collectionItems, true)
                        .slice(firstRowIndex, firstRowIndex + currentPageSize)
                        .map((item) => {
                          const itemId = item._id || item._userItemId
                          const isItemExpanded = expandedItems[itemId] || false
                          const isTelemetryReadingsExpanded = expandedTelemetryItems[itemId]?.readings !== undefined
                          const isLoadingReadings = expandedTelemetryItems[itemId]?.loading
                          const readings = expandedTelemetryItems[itemId]?.readings || []
                          
                          // Get display values
                          const displayName = getItemDisplayName(item, true)
                          const namePairs = getItemKeyValuePairsByPattern(item, 'name')
                          const equipPairs = getItemKeyValuePairsByPattern(item, 'equip')
                          const descPairs = getItemKeyValuePairsByPattern(item, 'desc')
                          const kindValue = getItemValueByKeyPattern(item, 'kind')
                          const unitValue = getItemValueByKeyPattern(item, 'unit')
                          
                          // Format multiple key-value pairs for display
                          const formatKeyValuePairs = (pairs) => {
                            if (pairs.length === 0) return '-'
                            return pairs.map(({ key, value }) => {
                              const displayValue = value !== null && value !== undefined ? String(value) : '-'
                              return `${key}: ${displayValue}`
                            }).join(' | ')
                          }
                          
                          return (
                            <React.Fragment key={itemId}>
                              <TableRow>
                                <TableCell>
                                  <Button
                                    kind="ghost"
                                    size="sm"
                                    hasIconOnly
                                    iconDescription={isItemExpanded ? "Collapse" : "Expand"}
                                    onClick={() => {
                                      toggleItemExpansion(itemId, item, true)
                                      // Load readings with date range if enabled
                                      if (useDateRange && startDate && endDate) {
                                        loadTelemetryReadings(
                                          item,
                                          selectedCollection._id || selectedCollection._userItemId,
                                          {
                                            startDate,
                                            startTime,
                                            endDate,
                                            endTime
                                          }
                                        )
                                      }
                                    }}
                                    disabled={isLoadingReadings}
                                  >
                                    {isItemExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  {formatKeyValuePairs(namePairs)}
                                </TableCell>
                                <TableCell>
                                  {formatKeyValuePairs(equipPairs)}
                                </TableCell>
                                <TableCell>
                                  {formatKeyValuePairs(descPairs)}
                                </TableCell>
                                <TableCell>
                                  {kindValue !== null ? String(kindValue) : '-'}
                                </TableCell>
                                <TableCell>
                                  {unitValue !== null ? String(unitValue) : '-'}
                                </TableCell>
                              </TableRow>
                              {isItemExpanded && (
                                <TableRow>
                                  <TableCell colSpan={6} style={{ backgroundColor: '#161616', padding: '1rem' }}>
                                    <div>
                                      {/* Telemetry Readings Section */}
                                      <div>
                                        {isLoadingReadings ? (
                                          <Loading description="Loading readings..." small />
                                        ) : readings.length > 0 ? (
                                          <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                              <p style={{ fontWeight: 'bold', fontSize: '0.875rem', margin: 0, color: 'white', backgroundColor: 'black', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                {useDateRange && startDate && endDate 
                                                  ? `Readings (${readings.length} found in date range):`
                                                  : `Last 10 Readings (${readings.length}):`}
                                              </p>
                                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {/* Display mode selector - only show if readings are numeric */}
                                                {expandedTelemetryItems[itemId]?.isNumeric && (
                                                  <Select
                                                    id={`display-mode-${itemId}`}
                                                    labelText=""
                                                    value={telemetryDisplayMode[itemId] || 'table'}
                                                    onChange={(event) => {
                                                      const mode = event.target?.value || event.selectedItem?.value
                                                      setTelemetryDisplayMode(prev => ({
                                                        ...prev,
                                                        [itemId]: mode
                                                      }))
                                                    }}
                                                    size="sm"
                                                    style={{ width: '120px' }}
                                                  >
                                                    <SelectItem value="table" text="Table" />
                                                    <SelectItem value="chart" text="Chart" />
                                                  </Select>
                                                )}
                                                {/* Aggregation selector - only show if readings are numeric */}
                                                {expandedTelemetryItems[itemId]?.isNumeric && (
                                                  <>
                                                    <Select
                                                      id={`aggregation-${itemId}`}
                                                      labelText=""
                                                      value={telemetryAggregation[itemId]?.period || ''}
                                                      onChange={(event) => {
                                                        const period = event.target?.value || event.selectedItem?.value
                                                        if (period) {
                                                          setTelemetryAggregation(prev => ({
                                                            ...prev,
                                                            [itemId]: { ...prev[itemId], period }
                                                          }))
                                                          // Load aggregated readings
                                                          const dateRange = useDateRange && startDate && endDate ? {
                                                            startDate,
                                                            startTime,
                                                            endDate,
                                                            endTime
                                                          } : null
                                                          loadAggregatedTelemetryReadingsServer(
                                                            item,
                                                            selectedCollection._id || selectedCollection._userItemId,
                                                            period,
                                                            dateRange
                                                          )
                                                        } else {
                                                          // Clear aggregation, reload regular readings
                                                          setTelemetryAggregation(prev => ({
                                                            ...prev,
                                                            [itemId]: { ...prev[itemId], period: '' }
                                                          }))
                                                          const dateRange = useDateRange && startDate && endDate ? {
                                                            startDate,
                                                            startTime,
                                                            endDate,
                                                            endTime
                                                          } : null
                                                          loadTelemetryReadings(item, selectedCollection._id || selectedCollection._userItemId, dateRange)
                                                        }
                                                      }}
                                                      size="sm"
                                                      style={{ width: '200px' }}
                                                    >
                                                      <SelectItem value="" text="No aggregation" />
                                                      <SelectItem value="hour" text="Every Hour" />
                                                      <SelectItem value="3hours" text="Every 3 Hours" />
                                                      <SelectItem value="day" text="Every Day" />
                                                      <SelectItem value="week" text="Every Week" />
                                                      <SelectItem value="month" text="Every Month" />
                                                    </Select>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            {/* Display mode: Table or Chart */}
                                            {telemetryDisplayMode[itemId] === 'chart' ? (
                                              <div style={{ marginTop: '1rem', height: '400px', backgroundColor: '#262626', padding: '1rem', borderRadius: '4px' }}>
                                                {(() => {
                                                  const chartData = convertReadingsToChartData(readings, expandedTelemetryItems[itemId]?.aggregated, item)
                                                  return chartData.data.length > 0 ? (
                                                    <LineChart
                                                      data={chartData.data}
                                                      options={chartData.options}
                                                    />
                                                  ) : (
                                                    <p style={{ fontSize: '0.875rem', color: '#8d8d8d', textAlign: 'center', padding: '2rem' }}>
                                                      No data available for chart
                                                    </p>
                                                  )
                                                })()}
                                              </div>
                                            ) : (
                                              <Table size="sm">
                                                <TableHead>
                                                  <TableRow>
                                                    <TableHeader>Timestamp</TableHeader>
                                                    {expandedTelemetryItems[itemId]?.aggregated ? (
                                                      <>
                                                        <TableHeader>Average</TableHeader>
                                                        <TableHeader>Min</TableHeader>
                                                        <TableHeader>Max</TableHeader>
                                                        <TableHeader>Count</TableHeader>
                                                      </>
                                                    ) : (
                                                      <TableHeader>Value</TableHeader>
                                                    )}
                                                  </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                  {readings.map((reading, idx) => {
                                                    // Format timestamp - handle both Date objects and string formats
                                                    let formattedTimestamp = '-'
                                                    if (reading._ts) {
                                                      try {
                                                        // Try parsing as Date if it's a string, otherwise use directly
                                                        const ts = typeof reading._ts === 'string' 
                                                          ? new Date(reading._ts) 
                                                          : reading._ts
                                                        formattedTimestamp = ts instanceof Date && !isNaN(ts)
                                                          ? ts.toLocaleString()
                                                          : reading._ts // Fallback to original string if parsing fails
                                                      } catch (e) {
                                                        formattedTimestamp = reading._ts // Use original value if parsing fails
                                                      }
                                                    }
                                                    
                                                    // Check if this is aggregated data
                                                    if (expandedTelemetryItems[itemId]?.aggregated) {
                                                      // Display aggregated values (avg, min, max, count)
                                                      return (
                                                        <TableRow key={idx}>
                                                          <TableCell style={{ fontSize: '0.75rem' }}>
                                                            {formattedTimestamp}
                                                          </TableCell>
                                                          <TableCell style={{ fontSize: '0.75rem' }}>
                                                            {reading.avg !== null && reading.avg !== undefined 
                                                              ? Number(reading.avg).toFixed(2) 
                                                              : '-'}
                                                          </TableCell>
                                                          <TableCell style={{ fontSize: '0.75rem' }}>
                                                            {reading.min !== null && reading.min !== undefined 
                                                              ? Number(reading.min).toFixed(2) 
                                                              : '-'}
                                                          </TableCell>
                                                          <TableCell style={{ fontSize: '0.75rem' }}>
                                                            {reading.max !== null && reading.max !== undefined 
                                                              ? Number(reading.max).toFixed(2) 
                                                              : '-'}
                                                          </TableCell>
                                                          <TableCell style={{ fontSize: '0.75rem' }}>
                                                            {reading.count !== null && reading.count !== undefined 
                                                              ? reading.count 
                                                              : '-'}
                                                          </TableCell>
                                                        </TableRow>
                                                      )
                                                    } else {
                                                      // Display regular reading value
                                                      const readingValue = getReadingValue(reading)
                                                      
                                                      return (
                                                        <TableRow key={idx}>
                                                          <TableCell style={{ fontSize: '0.75rem' }}>
                                                            {formattedTimestamp}
                                                          </TableCell>
                                                          <TableCell style={{ fontSize: '0.75rem' }}>
                                                            {readingValue !== null && readingValue !== undefined ? String(readingValue) : '-'}
                                                          </TableCell>
                                                        </TableRow>
                                                      )
                                                    }
                                                  })}
                                                </TableBody>
                                              </Table>
                                            )}
                                          </div>
                                        ) : (
                                          <p style={{ fontSize: '0.875rem', color: '#8d8d8d' }}>
                                            No readings available for this item.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          )
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Pagination
                  totalItems={collectionItems.length}
                  backwardText="Previous page"
                  forwardText="Next page"
                  pageSize={currentPageSize}
                  pageSizes={[5, 10, 15, 25, 50]}
                  itemsPerPageText="Items per page"
                  onChange={({ page, pageSize }) => {
                    if (pageSize !== currentPageSize) {
                      setCurrentPageSize(pageSize)
                    }
                    setFirstRowIndex(pageSize * (page - 1))
                  }}
                />
              </div>
            ) : (
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#8d8d8d' }}>
                No items found in this collection.
              </p>
            )}
          </Tile>
        </Column>
      </>
    )
  }

  // Render project selection page (shown after authentication)
  const renderProjectSelectionPage = () => {
    return (
      <Theme theme="g100">
        <Content>
          <Grid fullWidth>
            <Column lg={16} md={8} sm={4} className="app-header">
              <h1>Welcome to Twinit</h1>
              <p>Please select a project to get started</p>
            </Column>
            <Column lg={16} md={8} sm={4}>
              <Tile>
                <h3>Select a Project</h3>
                {projects.length > 0 ? (
                  <Select
                    id="initial-project-select"
                    labelText="Select a project"
                    value=""
                    onChange={(event) => {
                      const value = event.target?.value || event.selectedItem?.value
                      if (value) {
                        handleSelectProject(value)
                      }
                    }}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    <SelectItem value="" text="Select a project..." />
                    {projects.map((project) => (
                      <SelectItem 
                        key={project._id} 
                        value={project._id}
                        text={project._name || 'Unnamed Project'}
                      />
                    ))}
                  </Select>
                ) : (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#8d8d8d', marginBottom: '0.5rem' }}>
                      {isLoading ? 'Loading projects...' : 'No projects available'}
                    </p>
                    {!isLoading && (
                      <Button
                        onClick={() => handleLoadProjects(true)}
                      >
                        Load Projects
                      </Button>
                    )}
                  </div>
                )}
              </Tile>
            </Column>
            {error && (
              <Column lg={16} md={8} sm={4}>
                <InlineNotification
                  kind="error"
                  title="Error"
                  subtitle={error}
                  lowContrast
                  onClose={() => setError(null)}
                />
              </Column>
            )}
          </Grid>
        </Content>
      </Theme>
    )
  }

  // Render home page content
  const renderHomePage = () => {
    // If no project is selected, show message to use app switcher
    if (!currentProject) {
      return (
        <>
          <Column lg={16} md={8} sm={4} className="app-header">
            <h1>Welcome to Twinit</h1>
          </Column>
          <Column lg={16} md={8} sm={4}>
            <Tile>
              <h3>No Project Selected</h3>
              <p>Please select a project using the application switcher in the header.</p>
            </Tile>
          </Column>
        </>
      )
    }

    // Show project details and collections if project is selected
    return (
      <>
        <Column lg={16} md={8} sm={4} className="app-header">
          <h1>{currentProject._name || 'Project'}</h1>
          <p style={{ fontSize: '0.875rem', color: '#8d8d8d' }}>
            {currentProject._description || 'Project workspace'}
          </p>
        </Column>

        {/* Project Details and Collections */}
        <>

            {loadingCollections ? (
              <Column lg={16} md={8} sm={4}>
                <Loading description="Loading collections..." />
              </Column>
            ) : collections.length > 0 ? (
          <>
            <Column lg={16} md={8} sm={4}>
              <Tile>
                <h3>Available Collections ({collections.length})</h3>
                
                {/* Collection type filter */}
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <Select
                    id="collection-filter"
                    labelText="Filter by type"
                    value={collectionFilter}
                    onChange={(event) => {
                      const value = event.target?.value || event.selectedItem?.value
                      setCollectionFilter(value)
                      // Clear selection when filter changes
                      setSelectedCollection(null)
                      setCollectionItems([])
                    }}
                    style={{ width: '100%' }}
                  >
                    <SelectItem value="all" text="All collections" />
                    <SelectItem value="namedUserItem" text="NamedUserItem collection" />
                    <SelectItem value="telemetry" text="Telemetry collection" />
                    <SelectItem value="other" text="Other collection" />
                  </Select>
                </div>

                {/* Filtered collections list */}
                <Select
                  id="collection-select"
                  labelText="Choose a collection"
                  value={selectedCollection?._id || ''}
                  onChange={(event) => {
                    const value = event.target?.value || event.selectedItem?.value
                    if (value) {
                      handleSelectCollection(value)
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <SelectItem value="" text="Select a collection..." />
                  {collections
                    .filter(collection => {
                      if (collectionFilter === 'all') return true
                      if (collectionFilter === 'namedUserItem') {
                        // NamedUserItem: only NamedUserCollection (excluding telemetry)
                        return collection._itemClass === 'NamedUserCollection'
                      }
                      if (collectionFilter === 'telemetry') {
                        // Telemetry: only NamedTelemetryCollection
                        return collection._itemClass === 'NamedTelemetryCollection'
                      }
                      if (collectionFilter === 'other') {
                        // Other types: NamedFileCollection, NamedCompositeItem, etc. (excluding NamedUserCollection and NamedTelemetryCollection)
                        return collection._itemClass !== 'NamedUserCollection' && 
                               collection._itemClass !== 'NamedTelemetryCollection'
                      }
                      return true
                    })
                    .map((collection) => {
                      const displayText = collection._name || collection._shortName || 'Unnamed Collection'
                      const userType = collection._userType ? ` (${collection._userType})` : ''
                      const itemClass = collection._itemClass ? ` [${collection._itemClass}]` : ''
                      return (
                        <SelectItem 
                          key={collection._id} 
                          value={collection._id}
                          text={`${displayText}${userType}${itemClass}`}
                        />
                      )
                    })}
                </Select>
              </Tile>
            </Column>

            {selectedCollection && (
              <>
                <Column lg={16} md={8} sm={4}>
                  <Tile>
                    <h3>Collection: {selectedCollection._name || selectedCollection._shortName || 'Unnamed'}</h3>
                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#8d8d8d' }}>
                      <p><strong>ID:</strong> {selectedCollection._id}</p>
                      {selectedCollection._userType && (
                        <p><strong>User Type:</strong> {selectedCollection._userType}</p>
                      )}
                      {selectedCollection._itemClass && (
                        <p><strong>Item Class:</strong> {selectedCollection._itemClass}</p>
                      )}
                    </div>
                  </Tile>
                </Column>

                <Column lg={16} md={8} sm={4}>
                  <Tile>
                    <h3>Collection Items ({collectionItems.length})</h3>
                    {loadingItems ? (
                      <Loading description="Loading items..." />
                    ) : collectionItems.length > 0 ? (
                      <div style={{ marginTop: '1rem' }}>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableHeader style={{ width: '40px' }}></TableHeader>
                                <TableHeader>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      console.log('Name column clicked')
                                      handleSort('name')
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      margin: 0,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      color: 'inherit',
                                      font: 'inherit',
                                      userSelect: 'none'
                                    }}
                                  >
                                    <span>Name</span>
                                    {getSortIcon('name')}
                                  </button>
                                </TableHeader>
                                {selectedCollection?._itemClass === 'NamedTelemetryCollection' && (
                                  <>
                                    <TableHeader>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          console.log('Kind column clicked')
                                          handleSort('kind')
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          margin: 0,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          width: '100%',
                                          color: 'inherit',
                                          font: 'inherit',
                                          userSelect: 'none'
                                        }}
                                      >
                                        <span>Kind</span>
                                        {getSortIcon('kind')}
                                      </button>
                                    </TableHeader>
                                    <TableHeader>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          console.log('Unit column clicked')
                                          handleSort('unit')
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          margin: 0,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          width: '100%',
                                          color: 'inherit',
                                          font: 'inherit',
                                          userSelect: 'none'
                                        }}
                                      >
                                        <span>Unit</span>
                                        {getSortIcon('unit')}
                                      </button>
                                    </TableHeader>
                                  </>
                                )}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {getSortedItems(collectionItems, selectedCollection?._itemClass === 'NamedTelemetryCollection')
                                .slice(firstRowIndex, firstRowIndex + currentPageSize)
                                .map((item) => {
                                  const itemId = item._id || item._userItemId
                                  const isTelemetry = selectedCollection?._itemClass === 'NamedTelemetryCollection'
                                  const isItemExpanded = expandedItems[itemId] || false
                                  const isTelemetryReadingsExpanded = isTelemetry && expandedTelemetryItems[itemId]?.readings !== undefined
                                  const isLoadingReadings = expandedTelemetryItems[itemId]?.loading
                                  const readings = expandedTelemetryItems[itemId]?.readings || []
                                  
                                  // Get display values
                                  const displayName = getItemDisplayName(item, isTelemetry)
                                  const kindValue = isTelemetry ? getItemValueByKeyPattern(item, 'kind') : null
                                  const unitValue = isTelemetry ? getItemValueByKeyPattern(item, 'unit') : null
                                  
                                  // Get filtered properties (excluding metadata and prototype)
                                  const filteredProperties = getFilteredItemProperties(item)
                                  
                                  return (
                                    <React.Fragment key={itemId}>
                                      <TableRow>
                                        <TableCell>
                                          <Button
                                            kind="ghost"
                                            size="sm"
                                            hasIconOnly
                                            iconDescription={isItemExpanded ? "Collapse" : "Expand"}
                                            onClick={() => toggleItemExpansion(itemId, item, isTelemetry)}
                                            disabled={isTelemetry && isLoadingReadings}
                                          >
                                            {isItemExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                          </Button>
                                        </TableCell>
                                        <TableCell>
                                          {displayName}
                                        </TableCell>
                                        {isTelemetry && (
                                          <>
                                            <TableCell>
                                              {kindValue !== null ? String(kindValue) : '-'}
                                            </TableCell>
                                            <TableCell>
                                              {unitValue !== null ? String(unitValue) : '-'}
                                            </TableCell>
                                          </>
                                        )}
                                      </TableRow>
                                      {isItemExpanded && (
                                        <TableRow>
                                          <TableCell colSpan={isTelemetry ? 4 : 2} style={{ backgroundColor: '#161616', padding: '1rem' }}>
                                            <div>
                                              {/* Item Properties Section */}
                                              <div style={{ marginBottom: isTelemetry && readings.length > 0 ? '1.5rem' : '0' }}>
                                                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                                  Item Properties:
                                                </p>
                                                <Table size="sm">
                                                  <TableHead>
                                                    <TableRow>
                                                      <TableHeader>Property</TableHeader>
                                                      <TableHeader>Value</TableHeader>
                                                    </TableRow>
                                                  </TableHead>
                                                  <TableBody>
                                                    {Object.entries(filteredProperties).map(([key, value]) => {
                                                      // Format value for display
                                                      let displayValue = value
                                                      if (value === null || value === undefined) {
                                                        displayValue = '-'
                                                      } else if (typeof value === 'object') {
                                                        displayValue = JSON.stringify(value, null, 2)
                                                      } else {
                                                        displayValue = String(value)
                                                      }
                                                      
                                                      return (
                                                        <TableRow key={key}>
                                                          <TableCell style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            {key}
                                                          </TableCell>
                                                          <TableCell style={{ fontSize: '0.75rem' }}>
                                                            {displayValue}
                                                          </TableCell>
                                                        </TableRow>
                                                      )
                                                    })}
                                                  </TableBody>
                                                </Table>
                                              </div>

                                              {/* Telemetry Readings Section (only for telemetry collections) */}
                                              {isTelemetry && (
                                                <div>
                                                  {isLoadingReadings ? (
                                                    <Loading description="Loading readings..." small />
                                                  ) : readings.length > 0 ? (
                                                    <div>
                                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        <p style={{ fontWeight: 'bold', fontSize: '0.875rem', margin: 0, color: 'white', backgroundColor: 'black', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                          {useDateRange && startDate && endDate 
                                                            ? `Readings (${readings.length} found in date range):`
                                                            : `Last 10 Readings (${readings.length}):`}
                                                        </p>
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                          {/* Display mode selector - only show if readings are numeric */}
                                                          {expandedTelemetryItems[itemId]?.isNumeric && (
                                                            <Select
                                                              id={`display-mode-telemetry-${itemId}`}
                                                              labelText=""
                                                              value={telemetryDisplayMode[itemId] || 'table'}
                                                              onChange={(event) => {
                                                                const mode = event.target?.value || event.selectedItem?.value
                                                                setTelemetryDisplayMode(prev => ({
                                                                  ...prev,
                                                                  [itemId]: mode
                                                                }))
                                                              }}
                                                              size="sm"
                                                              style={{ width: '120px' }}
                                                            >
                                                              <SelectItem value="table" text="Table" />
                                                              <SelectItem value="chart" text="Chart" />
                                                            </Select>
                                                          )}
                                                          {/* Aggregation selector - only show if readings are numeric */}
                                                          {expandedTelemetryItems[itemId]?.isNumeric && (
                                                            <>
                                                              <Select
                                                                id={`aggregation-telemetry-${itemId}`}
                                                                labelText=""
                                                                value={telemetryAggregation[itemId]?.period || ''}
                                                                onChange={(event) => {
                                                                  const period = event.target?.value || event.selectedItem?.value
                                                                  if (period) {
                                                                    setTelemetryAggregation(prev => ({
                                                                      ...prev,
                                                                      [itemId]: { ...prev[itemId], period }
                                                                    }))
                                                                    // Load aggregated readings
                                                                    const dateRange = useDateRange && startDate && endDate ? {
                                                                      startDate,
                                                                      startTime,
                                                                      endDate,
                                                                      endTime
                                                                    } : null
                                                                    loadAggregatedTelemetryReadingsServer(
                                                                      item,
                                                                      selectedCollection._id || selectedCollection._userItemId,
                                                                      period,
                                                                      dateRange
                                                                    )
                                                                  } else {
                                                                    // Clear aggregation, reload regular readings
                                                                    setTelemetryAggregation(prev => ({
                                                                      ...prev,
                                                                      [itemId]: { ...prev[itemId], period: '' }
                                                                    }))
                                                                    const dateRange = useDateRange && startDate && endDate ? {
                                                                      startDate,
                                                                      startTime,
                                                                      endDate,
                                                                      endTime
                                                                    } : null
                                                                    loadTelemetryReadings(item, selectedCollection._id || selectedCollection._userItemId, dateRange)
                                                                  }
                                                                }}
                                                                size="sm"
                                                                style={{ width: '200px' }}
                                                              >
                                                                <SelectItem value="" text="No aggregation" />
                                                                <SelectItem value="hour" text="Every Hour" />
                                                                <SelectItem value="3hours" text="Every 3 Hours" />
                                                                <SelectItem value="day" text="Every Day" />
                                                                <SelectItem value="week" text="Every Week" />
                                                                <SelectItem value="month" text="Every Month" />
                                                              </Select>
                                                            </>
                                                          )}
                                                        </div>
                                                      </div>
                                                      {/* Display mode: Table or Chart */}
                                                      {telemetryDisplayMode[itemId] === 'chart' ? (
                                                        <div style={{ marginTop: '1rem', height: '400px', backgroundColor: '#262626', padding: '1rem', borderRadius: '4px' }}>
                                                          {(() => {
                                                            const chartData = convertReadingsToChartData(readings, expandedTelemetryItems[itemId]?.aggregated, item)
                                                            return chartData.data.length > 0 ? (
                                                              <LineChart
                                                                data={chartData.data}
                                                                options={chartData.options}
                                                              />
                                                            ) : (
                                                              <p style={{ fontSize: '0.875rem', color: '#8d8d8d', textAlign: 'center', padding: '2rem' }}>
                                                                No data available for chart
                                                              </p>
                                                            )
                                                          })()}
                                                        </div>
                                                      ) : (
                                                        <Table size="sm">
                                                        <TableHead>
                                                          <TableRow>
                                                            <TableHeader>Timestamp</TableHeader>
                                                            {expandedTelemetryItems[itemId]?.aggregated ? (
                                                              <>
                                                                <TableHeader>Average</TableHeader>
                                                                <TableHeader>Min</TableHeader>
                                                                <TableHeader>Max</TableHeader>
                                                                <TableHeader>Count</TableHeader>
                                                              </>
                                                            ) : (
                                                              <TableHeader>Value</TableHeader>
                                                            )}
                                                          </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                          {readings.map((reading, idx) => {
                                                            // Format timestamp - handle both Date objects and string formats
                                                            let formattedTimestamp = '-'
                                                            if (reading._ts) {
                                                              try {
                                                                // Try parsing as Date if it's a string, otherwise use directly
                                                                const ts = typeof reading._ts === 'string' 
                                                                  ? new Date(reading._ts) 
                                                                  : reading._ts
                                                                formattedTimestamp = ts instanceof Date && !isNaN(ts)
                                                                  ? ts.toLocaleString()
                                                                  : reading._ts // Fallback to original string if parsing fails
                                                              } catch (e) {
                                                                formattedTimestamp = reading._ts // Use original value if parsing fails
                                                              }
                                                            }
                                                            
                                                            // Check if this is aggregated data
                                                            if (expandedTelemetryItems[itemId]?.aggregated) {
                                                              // Display aggregated values (avg, min, max, count)
                                                              return (
                                                                <TableRow key={idx}>
                                                                  <TableCell style={{ fontSize: '0.75rem' }}>
                                                                    {formattedTimestamp}
                                                                  </TableCell>
                                                                  <TableCell style={{ fontSize: '0.75rem' }}>
                                                                    {reading.avg !== null && reading.avg !== undefined 
                                                                      ? Number(reading.avg).toFixed(2) 
                                                                      : '-'}
                                                                  </TableCell>
                                                                  <TableCell style={{ fontSize: '0.75rem' }}>
                                                                    {reading.min !== null && reading.min !== undefined 
                                                                      ? Number(reading.min).toFixed(2) 
                                                                      : '-'}
                                                                  </TableCell>
                                                                  <TableCell style={{ fontSize: '0.75rem' }}>
                                                                    {reading.max !== null && reading.max !== undefined 
                                                                      ? Number(reading.max).toFixed(2) 
                                                                      : '-'}
                                                                  </TableCell>
                                                                  <TableCell style={{ fontSize: '0.75rem' }}>
                                                                    {reading.count !== null && reading.count !== undefined 
                                                                      ? reading.count 
                                                                      : '-'}
                                                                  </TableCell>
                                                                </TableRow>
                                                              )
                                                            } else {
                                                              // Display regular reading value
                                                              const readingValue = getReadingValue(reading)
                                                              
                                                              return (
                                                                <TableRow key={idx}>
                                                                  <TableCell style={{ fontSize: '0.75rem' }}>
                                                                    {formattedTimestamp}
                                                                  </TableCell>
                                                                  <TableCell style={{ fontSize: '0.75rem' }}>
                                                                    {readingValue !== null && readingValue !== undefined ? String(readingValue) : '-'}
                                                                  </TableCell>
                                                                </TableRow>
                                                              )
                                                            }
                                                          })}
                                                        </TableBody>
                                                      </Table>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <p style={{ fontSize: '0.875rem', color: '#8d8d8d' }}>
                                                      No readings available for this item.
                                                    </p>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </React.Fragment>
                                  )
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Pagination
                          totalItems={collectionItems.length}
                          backwardText="Previous page"
                          forwardText="Next page"
                          pageSize={currentPageSize}
                          pageSizes={[5, 10, 15, 25, 50]}
                          itemsPerPageText="Items per page"
                          onChange={({ page, pageSize }) => {
                            if (pageSize !== currentPageSize) {
                              setCurrentPageSize(pageSize)
                            }
                            setFirstRowIndex(pageSize * (page - 1))
                          }}
                        />
                      </div>
                    ) : (
                      <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#8d8d8d' }}>
                        No items found in this collection.
                      </p>
                    )}
                  </Tile>
                </Column>
              </>
            )}
            </>
          ) : (
            <Column lg={16} md={8} sm={4}>
              <Tile>
                <h3>No Collections Found</h3>
                <p>This project doesn't have any collections yet, or you may not have permission to view them.</p>
              </Tile>
            </Column>
          )}
        </>
      </>
    )
  }

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <Theme theme="g100">
        <Content>
          <Auth 
            onAuthenticated={handleAuthenticated}
            endPointConfig={endPointConfig || defaultEndPointConfig}
          />
        </Content>
      </Theme>
    )
  }

  // Show project selection page if authenticated but no project selected yet
  // Only show if explicitly set (after fresh authentication) or if no project is selected and we're connected
  if (showProjectSelection || (!currentProject && isAuthenticated && isConnected && projects.length > 0)) {
    return renderProjectSelectionPage()
  }

  return (
    <Theme theme="g100">
      <HeaderContainer
        render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header aria-label="Twinit Carbon App">
            <SkipToContent />
            <HeaderMenuButton
              aria-label="Open menu"
              onClick={onClickSideNavExpand}
              isActive={isSideNavExpanded}
            />
            <HeaderName href="#" prefix="Twinit">
              Carbon App
            </HeaderName>
            <HeaderNavigation aria-label="Twinit Carbon App">
              <HeaderMenuItem 
                href="#home" 
                onClick={(e) => { e.preventDefault(); setCurrentPage('home') }}
                isActive={currentPage === 'home'}
              >
                Home
              </HeaderMenuItem>
              <HeaderMenuItem 
                href="#telemetry" 
                onClick={(e) => { e.preventDefault(); setCurrentPage('telemetry') }}
                isActive={currentPage === 'telemetry'}
              >
                Telemetry
              </HeaderMenuItem>
            </HeaderNavigation>
            <SideNav
              aria-label="Side navigation"
              expanded={isSideNavExpanded}
              isPersistent={false}
            >
              <SideNavItems>
                <HeaderSideNavItems>
                  <HeaderMenuItem 
                    href="#home" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setCurrentPage('home');
                      onClickSideNavExpand(); // Close side nav after selection
                    }}
                    isActive={currentPage === 'home'}
                  >
                    Home
                  </HeaderMenuItem>
                  <HeaderMenuItem 
                    href="#telemetry" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setCurrentPage('telemetry');
                      onClickSideNavExpand(); // Close side nav after selection
                    }}
                    isActive={currentPage === 'telemetry'}
                  >
                    Telemetry
                  </HeaderMenuItem>
                </HeaderSideNavItems>
              </SideNavItems>
            </SideNav>
            <HeaderGlobalBar>
              <HeaderGlobalAction
                aria-label="Notifications"
                tooltipAlignment="center"
                isActive={notificationPanelOpen}
                onClick={handleNotificationPanelToggle}
              >
                <Notification size={20} />
              </HeaderGlobalAction>
              <HeaderPanel
                expanded={notificationPanelOpen}
                aria-label="Notifications"
              >
                <div style={{ padding: '1rem' }}>
                  <p>Notifications</p>
                  <p style={{ fontSize: '0.875rem', color: '#8d8d8d' }}>No new notifications</p>
                </div>
              </HeaderPanel>
              
              <HeaderGlobalAction
                aria-label="User Avatar"
                tooltipAlignment="center"
                isActive={userPanelOpen}
                onClick={handleUserPanelToggle}
              >
                <UserAvatar size={20} />
              </HeaderGlobalAction>
              <HeaderPanel
                expanded={userPanelOpen}
                aria-label="User Menu"
              >
                <div style={{ padding: '1rem', minWidth: '300px' }}>
                  {currentUser && (
                    <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #393939' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#0f62fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}>
                          {getUserInitials()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            {currentUser._fullname || `${currentUser._firstname || ''} ${currentUser._lastname || ''}`.trim() || 'User'}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#8d8d8d' }}>
                            {currentUser._email || ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <a
                      href={getUserProfileUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 0', 
                        color: '#0f62fe',
                        textDecoration: 'none',
                        fontSize: '0.875rem'
                      }}
                    >
                      My Profile
                    </a>
                  </div>

                  {currentProject && currentUserGroup && (
                    <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #393939' }}>
                      <div style={{ fontSize: '0.875rem', color: '#8d8d8d', marginBottom: '0.5rem' }}>
                        Current User Group
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {currentUserGroup._name || 'Unknown'}
                      </div>
                      {userGroups.length > 1 && (
                        <Select
                          id="usergroup-select"
                          labelText="Switch User Group"
                          value={currentUserGroup._id}
                          onChange={(event) => {
                            const value = event.target?.value || event.selectedItem?.value
                            if (value) {
                              handleSwitchUserGroup(value)
                            }
                          }}
                          size="sm"
                          style={{ width: '100%' }}
                        >
                          {userGroups.map((ug) => (
                            <SelectItem 
                              key={ug._id} 
                              value={ug._id}
                              text={ug._name || 'Unnamed'}
                            />
                          ))}
                        </Select>
                      )}
                    </div>
                  )}

                  {isAdmin && currentProject && (
                    <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #393939' }}>
                      <div style={{ fontSize: '0.875rem', color: '#8d8d8d', marginBottom: '0.5rem' }}>
                        Admin Actions
                      </div>
                      <Button
                        kind="ghost"
                        size="sm"
                        onClick={handleOpenUserGroupManagement}
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                      >
                        Manage Project User Groups
                      </Button>
                    </div>
                  )}

                  <div>
                    <Button
                      kind="danger--ghost"
                      size="sm"
                      onClick={handleLogout}
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                      Log out
                    </Button>
                  </div>
                </div>
              </HeaderPanel>

              <HeaderGlobalAction
                aria-label="App Switcher"
                tooltipAlignment="end"
                isActive={appSwitcherOpen}
                onClick={handleAppSwitcherToggle}
              >
                <Switcher size={20} />
              </HeaderGlobalAction>
              <HeaderPanel
                expanded={appSwitcherOpen}
                aria-label="App Switcher"
              >
                <div style={{ padding: '1rem', minWidth: '300px' }}>
                  <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                    Switch Project
                  </div>
                  {projects.length > 0 ? (
                    <Select
                      id="project-switcher-select"
                      labelText="Select a project"
                      value={currentProject?._id || ''}
                      onChange={(event) => {
                        const value = event.target?.value || event.selectedItem?.value
                        if (value) {
                          handleSwitchProject(value)
                        }
                      }}
                      size="sm"
                      style={{ width: '100%', marginBottom: '1rem' }}
                    >
                      {projects.map((project) => (
                        <SelectItem 
                          key={project._id} 
                          value={project._id}
                          text={project._name || 'Unnamed Project'}
                        />
                      ))}
                    </Select>
                  ) : (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#8d8d8d', marginBottom: '0.5rem' }}>
                        No projects loaded
                      </p>
                      <Button
                        kind="ghost"
                        size="sm"
                        onClick={() => {
                          setAppSwitcherOpen(false)
                          handleLoadProjects()
                        }}
                      >
                        Load Projects
                      </Button>
                    </div>
                  )}
                </div>
              </HeaderPanel>
            </HeaderGlobalBar>
          </Header>
        )}
      />
      <Content>
        <Grid fullWidth>
          {error && (
            <Column lg={16} md={8} sm={4}>
              <InlineNotification
                kind="error"
                title="Error"
                subtitle={error}
                lowContrast
                onClose={() => setError(null)}
              />
            </Column>
          )}

          {isLoading && (
            <Column lg={16} md={8} sm={4}>
              <Loading description="Loading..." />
            </Column>
          )}

          {!isLoading && isConnected && (
            <>
              {currentPage === 'home' && renderHomePage()}
              {currentPage === 'telemetry' && renderTelemetryPage()}
            </>
          )}
        </Grid>
      </Content>

      {/* User Group Management Modal */}
      {userGroupModalOpen && (
        <Modal
          open={userGroupModalOpen}
          onRequestClose={() => setUserGroupModalOpen(false)}
          modalHeading={`User Groups for ${currentProject?._name || 'Project'}`}
          size="lg"
          primaryButtonText="Close"
          secondaryButtonText=""
          onRequestSubmit={() => setUserGroupModalOpen(false)}
        >
          <div style={{ padding: '1rem 0', maxHeight: '70vh', overflowY: 'auto' }}>
            {loadingUserGroups ? (
              <Loading description="Loading user groups..." />
            ) : allProjectUserGroups.length > 0 ? (
              <>
                {/* User Group Selection */}
                <div style={{ marginBottom: '2rem' }}>
                  <Select
                    id="usergroup-details-select"
                    labelText="Select a user group to view details"
                    value={selectedGroupForDetails?._id || ''}
                    onChange={(event) => {
                      const value = event.target?.value || event.selectedItem?.value
                      if (value) {
                        const group = allProjectUserGroups.find(g => g._id === value)
                        if (group) {
                          handleSelectGroupForDetails(group)
                        }
                      } else {
                        setSelectedGroupForDetails(null)
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    <SelectItem value="" text="Select a user group..." />
                    {allProjectUserGroups.map((group) => (
                      <SelectItem 
                        key={group._id} 
                        value={group._id}
                        text={group._name || 'Unnamed'}
                      />
                    ))}
                  </Select>
                </div>

                {/* Selected Group Details */}
                {selectedGroupForDetails && (
                  <div style={{ marginBottom: '2rem', borderTop: '1px solid #393939', paddingTop: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>
                      {selectedGroupForDetails._name || 'Unnamed Group'}
                    </h3>
                    
                    {/* Users in Group */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Members ({groupUsers[selectedGroupForDetails._id]?.length || 0})</h4>
                      {loadingGroupDetails ? (
                        <Loading description="Loading users..." />
                      ) : groupUsers[selectedGroupForDetails._id]?.length > 0 ? (
                        <TableContainer>
                          <Table size="sm">
                            <TableHead>
                              <TableRow>
                                <TableHeader>Name</TableHeader>
                                <TableHeader>Email</TableHeader>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {groupUsers[selectedGroupForDetails._id].map((user) => (
                                <TableRow key={user._id}>
                                  <TableCell>
                                    {user._firstname || ''} {user._lastname || ''}
                                  </TableCell>
                                  <TableCell>
                                    {user._email || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: '#8d8d8d' }}>No members in this group</p>
                      )}
                    </div>

                    {/* Invites */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                        Invitations
                        {groupInvites[selectedGroupForDetails._id] && (
                          <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#8d8d8d' }}>
                            {' '}({groupInvites[selectedGroupForDetails._id].pending.length} pending, {groupInvites[selectedGroupForDetails._id].expired.length} expired)
                          </span>
                        )}
                      </h4>
                      {groupInvites[selectedGroupForDetails._id]?.pending.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Pending:</p>
                          <ul style={{ fontSize: '0.875rem', color: '#8d8d8d', marginLeft: '1.5rem' }}>
                            {groupInvites[selectedGroupForDetails._id].pending.map((invite, idx) => (
                              <li key={idx}>{invite._email}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {groupInvites[selectedGroupForDetails._id]?.expired.length > 0 && (
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Expired:</p>
                          <ul style={{ fontSize: '0.875rem', color: '#8d8d8d', marginLeft: '1.5rem' }}>
                            {groupInvites[selectedGroupForDetails._id].expired.map((invite, idx) => (
                              <li key={idx}>{invite._email}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(!groupInvites[selectedGroupForDetails._id] || 
                        (groupInvites[selectedGroupForDetails._id].pending.length === 0 && 
                         groupInvites[selectedGroupForDetails._id].expired.length === 0)) && (
                        <p style={{ fontSize: '0.875rem', color: '#8d8d8d' }}>No invitations</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Invite Form */}
                <div style={{ borderTop: '1px solid #393939', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Send Invitations</h3>
                    <Button
                      kind="ghost"
                      size="sm"
                      onClick={() => {
                        setShowInviteForm(!showInviteForm)
                        if (!showInviteForm) {
                          setSelectedGroupsForInvite([])
                          setInviteEmails([])
                          setCurrentInviteEmail('')
                        }
                      }}
                    >
                      {showInviteForm ? 'Hide' : 'Show'} Form
                    </Button>
                  </div>

                  {showInviteForm && (
                    <div>
                      {/* Select Groups */}
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                          Select user groups to invite to:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {allProjectUserGroups.map((group) => (
                            <Checkbox
                              key={group._id}
                              id={`invite-group-${group._id}`}
                              labelText={group._name || 'Unnamed'}
                              checked={selectedGroupsForInvite.some(g => g._id === group._id)}
                              onChange={(checked) => {
                                if (checked) {
                                  setSelectedGroupsForInvite([...selectedGroupsForInvite, group])
                                } else {
                                  setSelectedGroupsForInvite(selectedGroupsForInvite.filter(g => g._id !== group._id))
                                }
                              }}
                            />
                          ))}
                        </div>
                        {selectedGroupsForInvite.length === 0 && (
                          <p style={{ fontSize: '0.875rem', color: '#da1e28', marginTop: '0.5rem' }}>
                            Please select at least one user group
                          </p>
                        )}
                      </div>

                      {/* Email Input */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <TextInput
                            id="invite-email-input"
                            labelText="Email address"
                            value={currentInviteEmail}
                            onChange={(e) => {
                              setCurrentInviteEmail(e.target.value)
                              setEmailError(null)
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddInviteEmail()
                              }
                            }}
                            placeholder="user@example.com"
                            invalid={!!emailError}
                            invalidText={emailError}
                            style={{ flex: 1 }}
                          />
                          <Button
                            onClick={handleAddInviteEmail}
                            disabled={!currentInviteEmail.trim()}
                            style={{ marginTop: '1.5rem' }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Email List */}
                      {inviteEmails.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Emails to invite ({inviteEmails.length}):</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {inviteEmails.map((emailObj, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#393939',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem'
                                }}
                              >
                                <span>{emailObj._email}</span>
                                <button
                                  onClick={() => handleRemoveInviteEmail(emailObj._email)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#8d8d8d',
                                    cursor: 'pointer',
                                    padding: '0',
                                    marginLeft: '0.25rem'
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Send Button */}
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button
                          kind="secondary"
                          onClick={() => {
                            setInviteEmails([])
                            setSelectedGroupsForInvite([])
                            setCurrentInviteEmail('')
                          }}
                          disabled={sendingInvites}
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={handleSendInvites}
                          disabled={inviteEmails.length === 0 || selectedGroupsForInvite.length === 0 || sendingInvites}
                        >
                          {sendingInvites ? 'Sending...' : 'Send Invites'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p>No user groups found for this project.</p>
                <p style={{ fontSize: '0.875rem', color: '#8d8d8d', marginTop: '0.5rem' }}>
                  You may not have permission to view user groups, or this project has no user groups configured.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Theme>
  )
}

export default App

