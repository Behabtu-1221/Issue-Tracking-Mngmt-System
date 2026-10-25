import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Briefcase,
  Sliders,
  Users,
  Shield,
  ShieldCheck,
  LayoutDashboard,
  Layers,
  Network,
  BookOpen,
  LifeBuoy,
  LogOut,
  ChevronRight,
  Bell,
  Menu,
  History,
  Search,
  UserCircle,
  CheckSquare,
  Send,
  Clock,
  MessageSquare,
  Sun,
  Moon,
  Check,
  Zap,
  Flag,
  List,
  Hash,
  Calendar,
  Globe,
  Cpu,
  ShieldAlert,
  ListChecks,
  RefreshCw,
  Inbox,
  Wrench,
  AlertTriangle,
  Timer,
  Megaphone,
  Activity,
  Monitor,
  FolderKanban,
  DollarSign,
  HardDrive,
  UserCheck,
  UserPlus,
  FileText,
  BarChart2,
  Tag,
  Building,
  Grid,
  MapPin,
  Compass,
  ChevronDown,
  User,
  Settings,
  Lock,
  Plus,
  X,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';
import { usePermissionContext } from '../modules/role-permission-management/contexts/PermissionContext';
import { useAuth } from '../modules/authentication/contexts/AuthContext';
import { notificationApi } from '../modules/notification/api/notificationApi';
import NotificationDetailModal from '../modules/notification/components/NotificationDetailModal';
import { playSoundChime } from '../modules/notification/components/NotifPreferencesTab';
import { useTranslation, LanguageSelector } from '../i18n';
import NeuronLogo from '../components/common/NeuronLogo';

export default function DashboardLayout({ children, activeMenu = 'parks', onNavigate }) {
  const { t, isRTL } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const currentSearch = location.search;
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState('all');
  const [selectedNotifDetail, setSelectedNotifDetail] = useState(null);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Auto-close mobile drawer on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Global Escape key listener for accessible dismissal (WCAG 2.1.1 Keyboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (showNotifications) setShowNotifications(false);
        if (showProfileMenu) setShowProfileMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, showNotifications, showProfileMenu]);

  const handleNav = (target) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(target.startsWith('/') ? target.slice(1) : target);
    } else {
      navigate(target.startsWith('/') ? target : `/${target}`);
    }
  };

  const prevUnreadCountRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const [inboxRes, countRes] = await Promise.all([
        notificationApi.getInbox({ limit: 20 }),
        notificationApi.getUnreadCount()
      ]);
      const rawList = inboxRes.data?.data || inboxRes.data?.notifications || (Array.isArray(inboxRes.data) ? inboxRes.data : []);
      setNotifications(Array.isArray(rawList) ? rawList : []);
      const unread = Number(countRes.data?.data?.unreadCount ?? countRes.data?.unreadCount ?? 0);

      // Play audio ringtone chime if new notification arrives and user has sound enabled
      if (prevUnreadCountRef.current !== null && unread > prevUnreadCountRef.current) {
        try {
          const stored = localStorage.getItem('itms_notification_preferences');
          const prefs = stored ? JSON.parse(stored) : { soundAlerts: true, soundProfile: 'aurora', soundVolume: 0.8 };
          if (prefs.soundAlerts !== false && !prefs.quietHours) {
            playSoundChime(prefs.soundProfile || 'aurora', prefs.soundVolume ?? 0.8);
          }
        } catch (e) {
          // ignore
        }
      }
      prevUnreadCountRef.current = unread;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Failed to fetch real-time notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 25000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, IsRead: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleMarkSingleRead = async (userNotificationId) => {
    try {
      await notificationApi.markAsRead(userNotificationId);
      setNotifications(prev => prev.map(n => n.UserNotificationID === userNotificationId ? { ...n, IsRead: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const handleMarkSingleUnread = async (userNotificationId) => {
    try {
      await notificationApi.markAsUnread(userNotificationId);
      setNotifications(prev => prev.map(n => n.UserNotificationID === userNotificationId ? { ...n, IsRead: 0 } : n));
      setUnreadCount(prev => prev + 1);
    } catch (err) {
      console.warn('Failed to mark notification unread:', err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.IsRead) {
      handleMarkSingleRead(n.UserNotificationID);
    }
    setShowNotifications(false);
    setSelectedNotifDetail({ ...n, IsRead: 1 });
  };

  const handleNavigateToResource = (n) => {
    setSelectedNotifDetail(null);
    setShowNotifications(false);

    const type = n?.TypeCode || '';
    const table = n?.TriggeredByTable || '';
    const resourceId = n?.TriggeredByID || '';
    const role = (user?.roleCode || user?.RoleCode || user?.userTypeCode || '').toUpperCase();
    const param = resourceId ? `?id=${resourceId}` : '';

    if (type.startsWith('APPROVAL') || type === 'HIGHER_APPROVAL_REQUIRED' || table === 'Approval') {
      handleNav(`approvals/queue${param}`);
    } else if (type === 'ISSUE_APPROVED_FOR_DISPATCH' || (type === 'APPROVAL_COMPLETED' && (role.includes('DISPATCH') || role.includes('MANAGER')))) {
      handleNav(`dispatch/queue${param}`);
    } else if ((type === 'ISSUE_ASSIGNED' || type === 'ASSIGNMENT_REASSIGNED') && (role === 'TECHNICIAN' || user?.isTechnician)) {
      handleNav(resourceId ? `technician/request/${resourceId}` : 'technician/assigned');
    } else if (type === 'ISSUE_RESOLVED' && (role === 'EMPLOYEE' || role === 'TENANT_REPRESENTATIVE')) {
      handleNav(`issues/my-requests${param}`);
    } else if (table === 'SLAClock' || type.startsWith('SLA')) {
      handleNav('sla/clocks');
    } else if (role === 'EMPLOYEE' || role === 'TENANT_REPRESENTATIVE') {
      handleNav(`issues/my-requests${param}`);
    } else {
      handleNav(`issues/tracker${param}`);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotifIcon = (typeCode = '') => {
    if (typeCode.startsWith('APPROVAL_REQUIRED') || typeCode === 'HIGHER_APPROVAL_REQUIRED') {
      return <Clock size={16} color="#f59e0b" />;
    }
    if (typeCode === 'ISSUE_APPROVED_FOR_DISPATCH') {
      return <Wrench size={16} color="#0ea5e9" />;
    }
    if (typeCode === 'APPROVAL_COMPLETED' || typeCode === 'ISSUE_RESOLVED' || typeCode === 'DEPARTMENT_APPROVED') {
      return <CheckCircle2 size={16} color="#10b981" />;
    }
    if (typeCode.startsWith('SLA') || typeCode === 'APPROVAL_REJECTED' || typeCode === 'REQUEST_CANCELLED') {
      return <ShieldAlert size={16} color="#ef4444" />;
    }
    if (typeCode === 'ISSUE_ASSIGNED' || typeCode === 'ASSIGNMENT_REASSIGNED') {
      return <Wrench size={16} color="#0ea5e9" />;
    }
    return <Bell size={16} color="#6366f1" />;
  };

  // Close notifications & profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { hasPermission, userScope, isParkAdmin, isCompanyAdmin } = usePermissionContext();

  const [expandedItems, setExpandedItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (itemId, e) => {
    if (e) e.stopPropagation();
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const activeRoleCode = (user?.roles && user.roles.length > 0)
    ? (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].RoleCode || user.roles[0].code || user.roles[0].name)
    : user?.userTypeCode;

  const isTechnicianRole = (activeRoleCode === 'TECHNICIAN' || activeRoleCode === 'PARK_TECHNICIAN') ||
    (hasPermission('Issue.Read.Assigned') && !isParkAdmin && !isCompanyAdmin && !hasPermission('Issue.Assign') && !hasPermission('Building.Read'));

  const isManagerRole = !isParkAdmin && !isCompanyAdmin && (
    activeRoleCode === 'DISPATCHER' || activeRoleCode === 'DEPARTMENT_MANAGER' || activeRoleCode === 'MANAGER' ||
    (hasPermission('Issue.Assign') || hasPermission('Issue.Approve'))
  );

  const isTenantRepRole = !isParkAdmin && (
    isCompanyAdmin ||
    activeRoleCode === 'TENANT_REPRESENTATIVE' ||
    activeRoleCode === 'TENANT_ADMIN' ||
    activeRoleCode === 'COMPANY_ADMIN' ||
    user?.userTypeCode === 'TENANT_REPRESENTATIVE'
  );

  const isEmployeeRole = !isTechnicianRole && !isManagerRole && !isTenantRepRole && (
    (activeRoleCode?.toUpperCase() === 'EMPLOYEE') ||
    (!isParkAdmin && !hasPermission('Department.Read') && !hasPermission('Building.Read') && !hasPermission('Issue.Assign') && !hasPermission('Issue.Approve'))
  );

  const standardCommunicationMenuItem = {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    permission: 'Communication.Read',
    children: [
      { id: 'communication/discussions', tabId: 'discussions', label: 'Request Discussions', icon: MessageSquare, permission: 'Communication.Read' },
      { id: 'communication/announcements', tabId: 'announcements', label: 'Announcements', icon: Megaphone, permission: 'Communication.Read' }
    ]
  };

  const staffCommunicationMenuItem = {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    permission: 'Communication.Read',
    children: [
      { id: 'communication/dashboard', tabId: 'dashboard', label: 'Comm Overview', icon: BarChart2, permission: 'Communication.Read' },
      { id: 'communication/discussions', tabId: 'discussions', label: 'Request Discussions', icon: MessageSquare, permission: 'Communication.Read' },
      { id: 'communication/announcements', tabId: 'announcements', label: 'Announcements', icon: Megaphone, permission: 'Communication.Read' },
      { id: 'communication/channels', tabId: 'channels', label: 'Team Channels', icon: Users, permission: 'Communication.Read' },
      { id: 'communication/timeline', tabId: 'timeline', label: 'Audit Timeline', icon: Activity, permission: 'Communication.Read' }
    ]
  };

  const userNotificationMenuItem = {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    children: [
      { id: 'notifications/inbox', tabId: 'inbox', label: 'Inbox & Alerts', icon: Inbox },
      { id: 'notifications/reminders', tabId: 'reminders', label: 'Automated Reminders', icon: Clock }
    ]
  };

  const adminNotificationMenuItem = {
    id: 'notifications',
    label: 'Notifications & Alerts',
    icon: Bell,
    children: [
      { id: 'notifications/dashboard', tabId: 'dashboard', label: 'Alerts Overview', icon: BarChart2 },
      { id: 'notifications/inbox', tabId: 'inbox', label: 'User Inbox & Feeds', icon: Inbox },
      { id: 'notifications/reminders', tabId: 'reminders', label: 'Automated Reminders', icon: Clock },
      { id: 'notifications/templates', tabId: 'templates', label: 'Notification Layouts', icon: BookOpen, permission: 'Notification.Manage' },
      { id: 'notifications/log', tabId: 'log', label: 'Delivery Audit Log', icon: History, permission: 'Notification.Manage' }
    ]
  };

  const technicianMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'technician/work',
      label: 'My Work',
      icon: Wrench,
      children: [
        { id: 'technician/assigned', tabId: 'assigned', label: 'Assigned Requests', icon: ListChecks },
        { id: 'technician/in-progress', tabId: 'in-progress', label: 'In Progress', icon: RefreshCw },
        { id: 'technician/pending', tabId: 'pending', label: 'Pending', icon: Clock },
        { id: 'technician/resolved', tabId: 'resolved', label: 'Resolved (Work History)', icon: CheckSquare }
      ]
    },
    staffCommunicationMenuItem,
    userNotificationMenuItem,
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  const fullServiceCatalogItem = {
    id: 'services',
    label: 'Service Catalog',
    icon: BookOpen,
    permission: 'Service.Read',
    children: [
      { id: 'services/dashboard', tabId: 'dashboard', label: 'Catalog Overview', icon: BarChart2, permission: 'Service.Read' },
      { id: 'services/directory', tabId: 'directory', label: 'Service Directory', icon: Layers, permission: 'Service.Read' },
      { id: 'services/categories', tabId: 'categories', label: 'Service Categories', icon: FolderKanban, permission: 'Service.Read' },
      { id: 'services/category-mappings', tabId: 'category-mappings', label: 'Category Mappings', icon: Tag, permission: 'Service.Update' }
    ]
  };

  const employeeServiceCatalogItem = {
    id: 'services',
    label: 'Service Catalog',
    icon: BookOpen,
    permission: 'Service.Read',
    children: [
      { id: 'services/directory', tabId: 'directory', label: 'Service Directory', icon: Layers, permission: 'Service.Read' }
    ]
  };

  const employeeMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'services/directory',
      label: 'Service Directory',
      icon: Layers,
      permission: 'Request.Read'
    },
    {
      id: 'issues/create',
      label: 'Create Request',
      icon: Plus,
      permission: 'Request.Create'
    },
    {
      id: 'issues/my-requests',
      label: 'My Requests',
      icon: ListChecks,
      permission: 'Request.Read'
    },
    {
      id: 'issues/history',
      label: 'Request History',
      icon: History,
      permission: 'Request.Read'
    },
    {
      id: 'communication/discussions',
      label: 'Request Discussions',
      icon: MessageSquare,
      permission: 'Communication.Read'
    },
    {
      id: 'communication/announcements',
      label: 'Announcements',
      icon: Megaphone,
      permission: 'Communication.Read'
    },
    {
      id: 'notifications/inbox',
      label: 'Inbox & Alerts',
      icon: Inbox
    },
    {
      id: 'notifications/reminders',
      label: 'Automated Reminders',
      icon: Clock
    }
  ];

  const managerMenuItems = [
    { id: 'dashboard', label: 'Operational Dashboard', icon: LayoutDashboard },
    fullServiceCatalogItem,
    {
      id: 'issues',
      label: 'Department Requests',
      icon: LifeBuoy,
      children: [
        { id: 'approvals/queue', tabId: 'queue', label: 'Pending Approval', icon: CheckSquare },
        { id: 'issues/tracker', tabId: 'tracker', label: 'Department Queue', icon: ListChecks },
        { id: 'dispatch/queue', tabId: 'queue', label: 'Awaiting Assignment', icon: Send },
        { id: 'issues/tracker?status=ASSIGNED', tabId: 'assigned', label: 'Assigned', icon: UserCheck },
        { id: 'issues/tracker?status=IN_PROGRESS', tabId: 'in-progress', label: 'In Progress', icon: RefreshCw },
        { id: 'sla/clocks', tabId: 'clocks', label: 'SLA At Risk', icon: AlertTriangle },
        { id: 'sla/breaches', tabId: 'breaches', label: 'Escalated', icon: ShieldAlert },
        { id: 'issues/tracker?status=RESOLVED', tabId: 'resolved', label: 'Resolved', icon: CheckCircle2 }
      ]
    },
    {
      id: 'dispatch',
      label: 'Dispatch & Teams',
      icon: Send,
      children: [
        { id: 'dispatch/queue', tabId: 'queue', label: 'Assignments Queue', icon: Inbox },
        { id: 'dispatch/workbench', tabId: 'workbench', label: 'Technician Workload', icon: Wrench },
        { id: 'dispatch/teams', tabId: 'teams', label: 'Technician Teams', icon: Users }
      ]
    },
    staffCommunicationMenuItem,
    {
      id: 'organization',
      label: 'Department',
      icon: Network,
      children: [
        { id: 'organization/assignments', tabId: 'users', label: 'Department Users', icon: Users }
      ]
    },
    { id: 'sla/dashboard', label: 'Operational Reports', icon: BarChart2 },
    userNotificationMenuItem,
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  const tenantRepresentativeMenuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    {
      id: 'issues',
      label: 'Issue Requests',
      icon: LifeBuoy,
      children: [
        { id: 'issues/create', tabId: 'create', label: 'Create Request', icon: Plus },
        { id: 'issues/tracker', tabId: 'tracker', label: 'Company Requests Tracker', icon: ListChecks },
        { id: 'issues/my-requests', tabId: 'my-requests', label: 'My Requests', icon: CheckSquare },
        { id: 'issues/history', tabId: 'history', label: 'Request History', icon: History }
      ]
    },
    {
      id: 'tenants',
      label: 'My Company',
      icon: Briefcase,
      children: [
        { id: 'tenants/dashboard', tabId: 'dashboard', label: 'Company Overview', icon: BarChart2 },
        { id: 'tenants/leases', tabId: 'leases', label: 'Lease Agreements', icon: FileText },
        { id: 'tenants/allocations', tabId: 'allocations', label: 'Space Allocations', icon: Building2 },
        { id: 'tenants/contacts', tabId: 'contacts', label: 'Company Contacts', icon: Building }
      ]
    },
    employeeServiceCatalogItem,
    standardCommunicationMenuItem,
    {
      id: 'reports',
      label: 'Reports & SLA',
      icon: BarChart2,
      children: [
        { id: 'reports/dashboard', tabId: 'dashboard', label: 'Control Center', icon: BarChart2 },
        { id: 'reports/requests', tabId: 'requests', label: 'Requests Analytics', icon: ListChecks },
        { id: 'reports/sla', tabId: 'sla', label: 'SLA Performance', icon: Clock }
      ]
    },
    userNotificationMenuItem,
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    {
      id: 'parks',
      label: 'Business Park',
      icon: Building2,
      permission: 'Building.Read',
      scope: 'BUSINESS_PARK',
      children: [
        { id: 'parks/dashboard', tabId: 'dashboard', label: 'Park Overview ', icon: BarChart2, permission: 'Building.Read' },
        { id: 'parks/campus', tabId: 'campus', label: 'Park Profile', icon: Building2, permission: 'Building.Read' },
        { id: 'parks/buildings', tabId: 'buildings', label: 'Buildings', icon: Building, permission: 'Building.Read' },
        { id: 'parks/floors', tabId: 'floors', label: 'Floors Level', icon: Layers, permission: 'Building.Read' },
        { id: 'parks/offices', tabId: 'offices', label: 'Offices Units', icon: Grid, permission: 'Building.Read' },
        { id: 'parks/zones', tabId: 'zones', label: 'Facilities Zones', icon: MapPin, permission: 'Building.Read' },
        { id: 'parks/landmarks', tabId: 'landmarks', label: 'Campus Landmarks', icon: Compass, permission: 'Building.Read' }
      ]
    },
    {
      id: 'tenants',
      label: 'Tenants & Leasing',
      icon: Briefcase,
      permission: 'Tenant.Read',
      scope: 'BUSINESS_PARK',
      children: [
        { id: 'tenants/dashboard', tabId: 'dashboard', label: 'Tenant Overview', icon: BarChart2, permission: 'Tenant.Read' },
        { id: 'tenants/directory', tabId: 'directory', label: 'Tenants Directory', icon: Users, permission: 'Tenant.Read' },
        { id: 'tenants/leases', tabId: 'leases', label: 'Lease Contracts', icon: FileText, permission: 'Tenant.Read' },
        { id: 'tenants/allocations', tabId: 'allocations', label: 'Space Allocations', icon: Building2, permission: 'Tenant.Read' },
        { id: 'tenants/sub-tenants', tabId: 'sub-tenants', label: 'Sub-Tenants Tree', icon: Layers, permission: 'Tenant.Read' },
        { id: 'tenants/contacts', tabId: 'contacts', label: 'Contacts', icon: Building, permission: 'Tenant.Read' }
      ]
    },
    fullServiceCatalogItem,
    {
      id: 'issues',
      label: 'Issue Requests',
      icon: LifeBuoy,
      permission: 'Issue.Read.Own',
      children: [
        { id: 'issues/dashboard', tabId: 'dashboard', label: 'Issue Overview ', icon: BarChart2, permission: 'Report.View' },
        { id: 'issues/tracker', tabId: 'tracker', label: 'Issue Requests Tracker', icon: ListChecks, permission: 'Issue.Read.Own' },
        { id: 'issues/status-flow', tabId: 'status-flow', label: 'Status Lifecycle', icon: RefreshCw, permission: 'Issue.Read.Company' }
      ]
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: CheckSquare,
      permission: 'Issue.Approve',
      children: [
        { id: 'approvals/dashboard', tabId: 'dashboard', label: 'Approval Overview', icon: BarChart2, permission: 'Issue.Approve' },
        { id: 'approvals/queue', tabId: 'queue', label: 'Approvals & Workflows Queue', icon: Layers, permission: 'Issue.Approve' },
        { id: 'approvals/delegations', tabId: 'delegations', label: 'Delegation Matrix', icon: UserCheck, permission: 'Issue.Approve' },
        { id: 'approvals/rules', tabId: 'rules', label: 'Governance Rules & Groups', icon: ShieldCheck, permission: 'Issue.Approve' }
      ]
    },
    {
      id: 'dispatch',
      label: 'Dispatch',
      icon: Send,
      permission: 'Issue.Assign',
      children: [
        { id: 'dispatch/dashboard', tabId: 'dashboard', label: 'Dispatch Overview', icon: BarChart2, permission: 'Issue.Assign' },
        { id: 'dispatch/queue', tabId: 'queue', label: 'Dispatcher Queue & Routing', icon: Inbox, permission: 'Issue.Assign' },
        { id: 'dispatch/workbench', tabId: 'workbench', label: 'Technician Workbench', icon: Wrench, permission: 'Issue.Read.Assigned' },
        { id: 'dispatch/roster', tabId: 'roster', label: 'Team Roster & Availability', icon: Users, permission: 'Issue.Assign' }
      ]
    },
    {
      id: 'sla',
      label: 'SLA & Escalations',
      icon: Clock,
      permission: 'Report.View',
      children: [
        { id: 'sla/dashboard', tabId: 'dashboard', label: 'SLA Overview & Analytics', icon: BarChart2, permission: 'Report.View' },
        { id: 'sla/clocks', tabId: 'clocks', label: 'SLA Dashboard & Live Clocks', icon: Timer, permission: 'Report.View' },
        { id: 'sla/breaches', tabId: 'breaches', label: 'Breach Log & Violations', icon: AlertTriangle, permission: 'Report.View' },
        { id: 'sla/policies', tabId: 'policies', label: 'SLA Policies & Targets', icon: ShieldCheck, permission: 'Report.View' }
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: MessageSquare,
      permission: 'Communication.Read',
      children: [
        { id: 'communication/dashboard', tabId: 'dashboard', label: 'Comm Overview ', icon: BarChart2, permission: 'Report.View' },
        { id: 'communication/discussions', tabId: 'discussions', label: 'Request Discussions', icon: MessageSquare, permission: 'Communication.Read' },
        { id: 'communication/announcements', tabId: 'announcements', label: 'Broadcast Announcements', icon: Megaphone, permission: 'Communication.Read' },
        { id: 'communication/channels', tabId: 'channels', label: 'Team Channels', icon: Users, permission: 'Communication.Read' },
        { id: 'communication/timeline', tabId: 'timeline', label: 'Activity & Audit Log', icon: Activity, permission: 'Audit.Read' }
      ]
    },
    adminNotificationMenuItem,
    {
      id: 'organization',
      label: 'Organization Management',
      icon: Network,
      permission: 'Department.Read',
      scope: 'BOTH',
      children: [
        { id: 'organization/dashboard', tabId: 'dashboard', label: 'Org Overview', icon: BarChart2, permission: 'Department.Read' },
        { id: 'organization/departments', tabId: 'departments', label: 'Departments Directory', icon: Building2, permission: 'Department.Read' },
        { id: 'organization/teams', tabId: 'teams', label: 'Teams & Positions', icon: Users, permission: 'Department.Read' },
        { id: 'organization/assignments', tabId: 'assignments', label: 'Employee Assignments', icon: UserPlus, permission: 'Department.Read' },
        { id: 'organization/financials', tabId: 'financials', label: 'Cost Centers & Budgets', icon: DollarSign, permission: 'Department.Read' }
      ]
    },
    {
      id: 'documents',
      label: 'Documents Mgmt',
      icon: HardDrive,
      permission: 'Document.Read',
      children: [
        { id: 'documents/dashboard', tabId: 'dashboard', label: 'Document Overview', icon: BarChart2, permission: 'Report.View' },
        { id: 'documents/repository', tabId: 'repository', label: 'Central Document Repository', icon: HardDrive, permission: 'Document.Read' },
        { id: 'documents/categories', tabId: 'categories', label: 'Document Categories', icon: FolderKanban, permission: 'Document.Read' },
        { id: 'documents/versions', tabId: 'versions', label: 'Version Control & History', icon: History, permission: 'Document.Read' },
        { id: 'documents/security', tabId: 'security', label: 'File Security & Sharing', icon: ShieldCheck, permission: 'Document.Read' }
      ]
    },
    {
      id: 'users',
      label: 'User Directory',
      icon: Users,
      permission: 'User.Read.Company',
      children: [
        { id: 'users/dashboard', tabId: 'dashboard', label: 'User Overview', icon: BarChart2, permission: 'User.Read.Company' },
        { id: 'users/directory', tabId: 'directory', label: 'Users Directory', icon: Users, permission: 'User.Read.Company' },
        { id: 'users/sessions', tabId: 'sessions', label: 'Active Sessions', icon: Monitor, permission: 'Session.Manage' },
        { id: 'users/audit', tabId: 'audit', label: 'Security Audit Logs', icon: FileText, permission: 'Audit.Read' }
      ]
    },
    {
      id: 'roles',
      label: 'Role & RBAC Governance',
      icon: ShieldCheck,
      permission: 'Role.Read',
      children: [
        { id: 'roles/dashboard', tabId: 'dashboard', label: 'RBAC Overview', icon: BarChart2, permission: 'Role.Read' },
        { id: 'roles/management', tabId: 'management', label: 'Roles', icon: Shield, permission: 'Role.Read' },
        { id: 'roles/matrix', tabId: 'matrix', label: 'Permission Matrix', icon: Sliders, permission: 'Role.Read' },
        { id: 'roles/assignments', tabId: 'assignments', label: 'Role Assignments & Users', icon: UserCheck, permission: 'Role.Read' },
        { id: 'roles/audit', tabId: 'audit', label: 'Security Audit Trail', icon: FileText, permission: 'Audit.Read' }
      ]
    },
    {
      id: 'configuration',
      label: 'System Configuration',
      icon: Sliders,
      permission: 'Building.Create',
      scope: 'BUSINESS_PARK',
      children: [
        { id: 'configuration/dashboard', tabId: 'dashboard', label: 'Config Overview', icon: BarChart2, permission: 'Building.Create' },
        { id: 'configuration/settings', tabId: 'settings', label: 'System Settings & Parameters', icon: Sliders, permission: 'Building.Create' },
        { id: 'configuration/lookups', tabId: 'lookups', label: 'Master Lookups', icon: List, permission: 'Building.Create' },
        { id: 'configuration/sequences', tabId: 'sequences', label: 'Auto-Numbering Sequences', icon: Hash, permission: 'Building.Create' },
        { id: 'configuration/calendars', tabId: 'calendars', label: 'Business Hours & Calendars', icon: Calendar, permission: 'Building.Create' },
        { id: 'configuration/flags', tabId: 'flags', label: 'Feature Toggles & Flags', icon: Flag, permission: 'Building.Create' },
        { id: 'configuration/rules', tabId: 'rules', label: 'Business Rules & Automation', icon: Cpu, permission: 'Building.Create' },
        { id: 'configuration/localization', tabId: 'localization', label: 'Localization & i18n', icon: Globe, permission: 'Building.Create' },
        { id: 'configuration/bootstrap', tabId: 'bootstrap', label: 'System Seeding & Boot', icon: Zap, permission: 'Building.Create' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports & BI Analytics',
      icon: BarChart2,
      permission: 'Report.View',
      children: [
        { id: 'reports/dashboard', tabId: 'dashboard', label: 'Analytics Control Center', icon: BarChart2, permission: 'Report.View' },
        { id: 'reports/requests', tabId: 'requests', label: 'Requests Analytics', icon: ListChecks, permission: 'Report.View' },
        { id: 'reports/workload', tabId: 'workload', label: 'Workload Balance', icon: Users, permission: 'Report.View' },
        { id: 'reports/sla', tabId: 'sla', label: 'SLA & Escalations', icon: Clock, permission: 'Report.View' },
        { id: 'reports/tenants', tabId: 'tenants', label: 'Tenant Benchmarks', icon: Building2, permission: 'Tenant.Read', scope: 'BUSINESS_PARK' },
        { id: 'reports/departments', tabId: 'departments', label: 'Department Efficiency', icon: Network, permission: 'Department.Read' },
        { id: 'reports/saved', tabId: 'saved', label: 'Saved Custom Reports', icon: Bookmark, permission: 'Report.View' },
        { id: 'reports/schedules', tabId: 'schedules', label: 'Automated Schedules', icon: Calendar, permission: 'Report.Schedule' }
      ]
    }
  ];

  const menuItems = isTechnicianRole
    ? technicianMenuItems
    : isEmployeeRole
      ? employeeMenuItems
      : isManagerRole
        ? managerMenuItems
        : isTenantRepRole
          ? tenantRepresentativeMenuItems
          : adminMenuItems;

  const getLocalizedLabel = (item) => {
    if (!item) return '';
    const rawId = item.id || '';
    const cleanId = rawId.split('?')[0];

    const keyMap = {
      'dashboard': 'nav.dashboard',
      'parks': 'nav.parks',
      'parks/dashboard': 'nav.parkOverview',
      'parks/campus': 'nav.campusProfile',
      'parks/buildings': 'nav.buildingsBlocks',
      'parks/floors': 'nav.floorsLevels',
      'parks/offices': 'nav.officeUnits',
      'parks/zones': 'nav.facilityZones',
      'parks/landmarks': 'nav.campusLandmarks',
      'tenants': 'nav.tenants',
      'tenants/dashboard': 'nav.tenantOverview',
      'tenants/directory': 'nav.tenantDirectory',
      'tenants/leases': 'nav.leaseAgreements',
      'tenants/allocations': 'nav.spaceAllocations',
      'tenants/sub-tenants': 'nav.subTenants',
      'tenants/contacts': 'nav.tenantContacts',
      'services': 'nav.services',
      'services/dashboard': 'nav.servicesOverview',
      'services/directory': 'nav.serviceDirectory',
      'services/categories': 'nav.serviceCategories',
      'services/category-mappings': 'nav.serviceCategoryMapping',
      'issues': 'nav.issues',
      'issues/dashboard': 'nav.issuesOverview',
      'issues/tracker': 'nav.issuesTracker',
      'issues/create': 'nav.createRequest',
      'issues/my-requests': 'nav.myRequests',
      'issues/history': 'nav.requestHistory',
      'issues/status-flow': 'nav.statusFlow',
      'approvals': 'nav.approvals',
      'approvals/dashboard': 'nav.approvalOverview',
      'approvals/queue': 'nav.approvalQueue',
      'approvals/delegations': 'nav.delegationMatrix',
      'approvals/rules': 'nav.governanceRules',
      'dispatch': 'nav.dispatch',
      'dispatch/dashboard': 'nav.dispatchOverview',
      'dispatch/queue': 'nav.dispatchQueue',
      'dispatch/workbench': 'nav.workbench',
      'dispatch/roster': 'nav.roster',
      'dispatch/teams': 'nav.technicianTeams',
      'sla': 'nav.sla',
      'sla/dashboard': 'nav.slaOverview',
      'sla/clocks': 'nav.slaClocks',
      'sla/breaches': 'nav.slaBreaches',
      'sla/policies': 'nav.slaPolicies',
      'communication': 'nav.communication',
      'communication/dashboard': 'nav.commOverview',
      'communication/discussions': 'nav.discussions',
      'communication/announcements': 'nav.announcements',
      'communication/channels': 'nav.channels',
      'communication/timeline': 'nav.activityTimeline',
      'organization': 'nav.organization',
      'organization/dashboard': 'nav.orgOverview',
      'organization/departments': 'nav.departments',
      'organization/teams': 'nav.teamsPositions',
      'organization/assignments': 'nav.employeeAssignments',
      'organization/financials': 'nav.financials',
      'documents': 'nav.documents',
      'documents/dashboard': 'nav.docOverview',
      'documents/repository': 'nav.docRepository',
      'documents/categories': 'nav.docCategories',
      'documents/versions': 'nav.docVersions',
      'documents/security': 'nav.docSecurity',
      'users': 'nav.users',
      'users/dashboard': 'nav.userOverview',
      'users/directory': 'nav.usersDirectory',
      'users/sessions': 'nav.activeSessions',
      'users/audit': 'nav.securityAudit',
      'roles': 'nav.roles',
      'roles/dashboard': 'nav.rbacOverview',
      'roles/management': 'nav.roleManagement',
      'roles/matrix': 'nav.permissionMatrix',
      'roles/assignments': 'nav.roleAssignments',
      'roles/audit': 'nav.auditTrail',
      'configuration': 'nav.configuration',
      'configuration/dashboard': 'nav.configOverview',
      'configuration/settings': 'nav.systemSettings',
      'configuration/lookups': 'nav.masterLookups',
      'configuration/sequences': 'nav.numberSequences',
      'configuration/calendars': 'nav.businessCalendars',
      'configuration/flags': 'nav.featureFlags',
      'configuration/rules': 'nav.businessRules',
      'configuration/localization': 'nav.localization',
      'configuration/bootstrap': 'nav.systemBootstrap',
      'reports': 'nav.reports',
      'reports/dashboard': 'nav.reportsOverview',
      'reports/executive': 'nav.executiveDashboard',
      'reports/requests': 'nav.requestsAnalytics',
      'reports/workload': 'nav.workloadBalance',
      'reports/sla': 'nav.slaEscalations',
      'reports/tenants': 'nav.tenantBenchmarks',
      'reports/departments': 'nav.departmentEfficiency',
      'reports/saved': 'nav.savedReports',
      'reports/schedules': 'nav.automatedSchedules',
      'notifications': 'nav.notifications',
      'notifications/dashboard': 'nav.notificationInbox',
      'notifications/inbox': 'nav.notificationInbox',
      'notifications/preferences': 'nav.notificationPreferences',
      'notifications/reminders': 'nav.automatedReminders',
      'notifications/templates': 'nav.notificationTemplates',
      'notifications/log': 'nav.deliveryLog',
      'profile': 'nav.profile',
      'technician/work': 'nav.myWork',
      'technician/dashboard': 'nav.assignedWork',
      'technician/assigned': 'nav.assignedWork',
      'technician/in-progress': 'issues.statusInProgress',
      'technician/pending': 'issues.statusPending',
      'technician/resolved': 'nav.workHistory',
      'issues/tracker?status=ASSIGNED': 'issues.statusAssigned',
      'issues/tracker?status=IN_PROGRESS': 'issues.statusInProgress',
      'issues/tracker?status=RESOLVED': 'issues.statusResolved'
    };

    const labelMap = {
      'Dashboard': 'nav.dashboard',
      'Dashboard Overview': 'nav.dashboardOverview',
      'Operational Dashboard': 'nav.dashboard',
      'My Work': 'nav.myWork',
      'Assigned Requests': 'nav.assignedWork',
      'In Progress': 'issues.statusInProgress',
      'Pending': 'issues.statusPending',
      'Resolved': 'issues.statusResolved',
      'Resolved (Work History)': 'nav.workHistory',
      'My Requests': 'nav.myRequests',
      'Create Request': 'nav.createRequest',
      'Request History': 'nav.requestHistory',
      'Department Requests': 'nav.departmentRequests',
      'Pending Approval': 'nav.pendingApproval',
      'Department Queue': 'nav.departmentQueue',
      'Awaiting Assignment': 'nav.awaitingAssignment',
      'Assigned': 'issues.statusAssigned',
      'SLA At Risk': 'nav.slaAtRisk',
      'Escalated': 'nav.escalated',
      'Dispatch & Teams': 'nav.dispatchTeams',
      'Assignments Queue': 'nav.assignmentsQueue',
      'Technician Workload': 'nav.technicianWorkload',
      'Technician Teams': 'nav.technicianTeams',
      'Department': 'nav.department',
      'Department Users': 'nav.departmentUsers',
      'Operational Reports': 'nav.operationalReports',
      'Issue Requests': 'nav.issueRequests',
      'Company Requests Tracker': 'nav.companyRequestsTracker',
      'My Company': 'nav.myCompany',
      'Company Overview': 'nav.companyOverview',
      'Lease Agreements': 'nav.leaseAgreements',
      'Lease Contracts': 'nav.leaseAgreements',
      'Space Allocations': 'nav.spaceAllocations',
      'Company Contacts': 'nav.companyContacts',
      'Reports & SLA': 'nav.reportsSla',
      'Control Center': 'nav.controlCenter',
      'Requests Analytics': 'nav.requestsAnalytics',
      'SLA Performance': 'nav.slaPerformance',
      'Park Overview ': 'nav.parkOverview',
      'Issue Overview ': 'nav.issuesOverview',
      'Comm Overview ': 'nav.commOverview',
      'Broadcast Announcements': 'nav.broadcastAnnouncements',
      'Announcements': 'nav.announcements',
      'Team Channels': 'nav.channels',
      'Activity & Audit Log': 'nav.activityTimeline',
      'Audit Timeline': 'nav.activityTimeline',
      'Delivery Audit Log': 'nav.deliveryLog',
      'Notification Layouts': 'nav.notificationTemplates',
      'Central Document Repository': 'nav.docRepository',
      'Version Control & History': 'nav.docVersions',
      'File Security & Sharing': 'nav.docSecurity',
      'Active Sessions': 'nav.activeSessions',
      'Security Audit Logs': 'nav.securityAudit',
      'Governance Rules & Groups': 'nav.governanceRules',
      'Dispatcher Queue & Routing': 'nav.dispatchQueue',
      'Technician Workbench': 'nav.workbench',
      'Team Roster & Availability': 'nav.roster',
      'SLA Dashboard & Live Clocks': 'nav.slaClocks',
      'Breach Log & Violations': 'nav.slaBreaches',
      'SLA Policies & Targets': 'nav.slaPolicies',
      'Cost Centers & Budgets': 'nav.financials',
      'Saved Custom Reports': 'nav.savedReports',
      'Automated Schedules': 'nav.automatedSchedules',
      'Tenant Benchmarks': 'nav.tenantBenchmarks',
      'Department Efficiency': 'nav.departmentEfficiency',
      'User Inbox & Feeds': 'nav.notificationInbox',
      'Inbox & Alerts': 'nav.notificationInbox',
      'Alerts Overview': 'nav.notificationInbox',
      'Delivery Preferences': 'nav.notificationPreferences',
      'Automated Reminders': 'nav.automatedReminders',
      'Service Catalog': 'nav.services',
      'Catalog Overview': 'nav.servicesOverview',
      'Service Directory': 'nav.serviceDirectory',
      'Service Categories': 'nav.serviceCategories',
      'Category Mappings': 'nav.serviceCategoryMapping'
    };

    const directKey = keyMap[rawId] || keyMap[cleanId] || labelMap[item.label?.trim()];
    return directKey ? t(directKey, item.label) : item.label;
  };

  const filteredMenuItems = menuItems
    .filter(item => {
      if (item.scope && item.scope !== 'BOTH') {
        if (!isParkAdmin && item.scope === 'BUSINESS_PARK') return false;
      }
      if (item.permission && !hasPermission(item.permission)) return false;
      return true;
    })
    .map(item => {
      let validChildren = Array.isArray(item.children)
        ? item.children.filter(child => {
          if (child.scope && child.scope !== 'BOTH') {
            if (!isParkAdmin && child.scope === 'BUSINESS_PARK') return false;
          }
          if (child.permission && !hasPermission(child.permission)) return false;
          return true;
        })
        : undefined;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const localizedParent = getLocalizedLabel(item).toLowerCase();
        const parentMatches = item.label.toLowerCase().includes(q) || localizedParent.includes(q);
        if (!parentMatches && validChildren) {
          validChildren = validChildren.filter(child => {
            const locChild = getLocalizedLabel(child).toLowerCase();
            return child.label.toLowerCase().includes(q) || locChild.includes(q);
          });
        }
      }

      return {
        ...item,
        children: validChildren
      };
    })
    .filter(item => {
      if (item.children && item.children.length === 0) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const localizedParent = getLocalizedLabel(item).toLowerCase();
      const parentMatches = item.label.toLowerCase().includes(q) || localizedParent.includes(q);
      const childMatches = Array.isArray(item.children) && item.children.length > 0;
      return parentMatches || childMatches;
    });

  // Items start collapsed by default and expand ONLY when explicitly clicked by user
  useEffect(() => {
    // Keep initial expanded state empty so sub-items stay collapsed until clicked
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="mobile-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 49
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: sidebarCollapsed ? '72px' : '260px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
          overflow: 'hidden',
          zIndex: 50
        }}
      >
        {/* Brand Logo & Menu Toggle */}
        <div style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          padding: sidebarCollapsed ? '0 12px' : '0 16px',
          borderBottom: '1px solid var(--sidebar-border)',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          flexShrink: 0
        }}>
          {!sidebarCollapsed ? (
            <>
              <NeuronLogo size={40} iconSize={26} showText={true} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-drawer-close-btn touch-target"
                  title={t('common.close', 'Close Menu')}
                  aria-label={t('common.close', 'Close Menu')}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--sidebar-border)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="desktop-sidebar-toggle-btn"
                  title={t('nav.toggleSidebar', 'Toggle Sidebar Menu')}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--sidebar-border)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    padding: '7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Menu size={18} />
                </button>
              </div>
            </>
          ) : (
            <div
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={t('nav.expandSidebar', 'Expand Sidebar Menu')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <NeuronLogo size={40} iconSize={26} showText={false} collapsed={true} />
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav" style={{ flex: 1, minHeight: 0, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

            const checkChildActive = (child) => {
              if (!child) return false;
              if (activeMenu === child.id) return true;

              // Handle sub-items with URL query params (e.g. issues/tracker?status=ASSIGNED)
              if (child.id.includes('?')) {
                const [cPath, cQuery] = child.id.split('?');
                const pathMatches = currentPath.endsWith('/' + cPath) || currentPath === '/' + cPath;
                const queryMatches = currentSearch.includes(cQuery);
                return pathMatches && queryMatches;
              }

              // If current URL has status query (e.g. ?status=ASSIGNED), plain issues/tracker shouldn't match
              if (currentSearch && currentSearch.includes('status=')) {
                return false;
              }

              // Exact path match
              const cleanId = child.id.startsWith('/') ? child.id : '/' + child.id;
              return currentPath === cleanId || currentPath.endsWith(cleanId);
            };

            const isChildActive = hasChildren && item.children.some(child => checkChildActive(child));
            
            const checkDirectActive = () => {
              if (activeMenu === item.id) return true;
              if (item.id === 'dashboard' && (currentPath === '/' || currentPath === '' || currentPath === '/dashboard')) return true;
              if (item.id.includes('?')) {
                const [iPath, iQuery] = item.id.split('?');
                const pathMatches = currentPath.endsWith('/' + iPath) || currentPath === '/' + iPath;
                const queryMatches = currentSearch.includes(iQuery);
                return pathMatches && queryMatches;
              }
              const cleanId = item.id.startsWith('/') ? item.id : '/' + item.id;
              return currentPath === cleanId || currentPath.endsWith(cleanId);
            };

            const isParentActive = checkDirectActive() || isChildActive;

            const isSearching = searchQuery.trim().length > 0;
            const isExpanded = isSearching ? true : !!expandedItems[item.id];

            return (
              <div key={item.id} style={{ marginBottom: '4px' }}>
                {/* Section Header for direct flat navigation items */}
                {item.sectionHeader && (
                  !sidebarCollapsed ? (
                    <div style={{
                      fontSize: '0.67rem',
                      fontWeight: '800',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted, #94a3b8)',
                      padding: '12px 12px 6px 12px',
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{item.sectionHeader}</span>
                    </div>
                  ) : (
                    <div style={{
                      height: '1px',
                      background: 'var(--sidebar-border, rgba(255, 255, 255, 0.08))',
                      margin: '8px 10px'
                    }} />
                  )
                )}

                {/* Parent Item Button */}
                <button
                  onClick={(e) => {
                    if (hasChildren && !sidebarCollapsed) {
                      toggleExpand(item.id, e);
                      if (!isExpanded && onNavigate) {
                        onNavigate(item.children[0].id);
                      }
                    } else {
                      if (onNavigate) onNavigate(item.id);
                    }
                  }}
                  className={`sidebar-parent-btn ${isParentActive ? 'active' : ''} ${isParentActive && !isChildActive ? 'active-solid' : isChildActive ? 'active-tint' : ''}`}
                  style={{
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                    fontWeight: isParentActive ? '800' : '700'
                  }}
                  title={sidebarCollapsed ? getLocalizedLabel(item) : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color={isParentActive ? '#ffffff' : 'var(--color-primary)'} />
                    {!sidebarCollapsed && (
                      <span style={{ fontWeight: isParentActive && !isChildActive ? '800' : '700', color: isParentActive && !isChildActive ? '#ffffff' : 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {getLocalizedLabel(item)}
                      </span>
                    )}
                  </div>

                  {!sidebarCollapsed && hasChildren && (
                    <div
                      onClick={(e) => toggleExpand(item.id, e)}
                      style={{
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: isExpanded ? (isRTL ? 'rotate(-90deg)' : 'rotate(90deg)') : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                        color: isParentActive ? '#ffffff' : 'var(--color-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronRight size={16} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                    </div>
                  )}
                </button>

                {/* Sub-menu Children Accordion List */}
                {!sidebarCollapsed && hasChildren && isExpanded && (
                  <div className="sidebar-children-inner" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: isRTL ? '0' : '14px', paddingRight: isRTL ? '14px' : '0' }}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isSubActive = checkChildActive(child);

                      return (
                        <button
                          key={child.id}
                          onClick={() => onNavigate && onNavigate(child.id)}
                          className={`sidebar-child-btn ${isSubActive ? 'child-active' : ''}`}
                          style={{
                            fontWeight: isSubActive ? '800' : '700',
                            color: isSubActive ? '#ffffff' : 'var(--text-secondary)',
                            backgroundColor: isSubActive ? 'var(--color-primary)' : 'transparent',
                            borderLeft: isSubActive ? (isRTL ? 'none' : '4px solid var(--color-primary)') : '4px solid transparent',
                            borderRight: isSubActive ? (isRTL ? '4px solid var(--color-primary)' : 'none') : '4px solid transparent',
                            borderRadius: '8px',
                            padding: '7px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <ChildIcon size={14} color={isSubActive ? '#ffffff' : 'var(--color-primary)'} />
                          <span style={{ fontWeight: isSubActive ? '800' : '700', fontSize: '0.86rem' }}>{getLocalizedLabel(child)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>


      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        {/* Top Navbar */}
        <header className="top-navbar px-3 sm:px-6" style={{
          height: '64px',
          borderBottom: '1px solid var(--color-border)',
          background: theme === 'dark' ? 'rgba(21, 26, 34, 0.88)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: theme === 'dark' ? '0 4px 20px -2px rgba(0, 0, 0, 0.4)' : '0 2px 12px -2px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            {/* Mobile Navigation Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-nav-toggle navbar-icon-btn"
              title={t('nav.toggleSidebar', 'Toggle Navigation Menu')}
              aria-label={t('nav.toggleSidebar', 'Toggle Navigation Menu')}
            >
              <Menu size={18} />
            </button>

            {/* Global Search Input */}
            <div className="navbar-search-wrapper">
              <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)', pointerEvents: 'none', transition: 'color 0.2s' }} />
              <input
                type="text"
                placeholder={t('common.searchPlaceholder', 'Global search across platform...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
                className="header-search-input navbar-search-input"
              />
              {!searchQuery && (
                <kbd className="search-shortcut-badge" title="Press / to search">/</kbd>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title={t('common.clear', 'Clear search')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'var(--color-surface)',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.transform = 'scale(1.0)'; }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            {/* Multi-Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle Button (Dark / Bright) */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? t('theme.switchToLight', 'Dark Theme Active • Click to switch to Light Theme') : t('theme.switchToDark', 'Light Theme Active • Click to switch to Dark Theme')}
              aria-label={theme === 'dark' ? t('theme.switchToLight', 'Dark Theme Active • Click to switch to Light Theme') : t('theme.switchToDark', 'Light Theme Active • Click to switch to Dark Theme')}
              className={`navbar-icon-btn navbar-theme-btn ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}
            >
              {theme === 'dark' ? (
                <Moon size={18} color="var(--color-primary, #60a5fa)" />
              ) : (
                <Sun size={18} color="#f59e0b" />
              )}
            </button>

            {/* Notification Button & Drawer */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                title={t('notifications.title', 'Notifications')}
                aria-label={t('notifications.title', 'Notifications')}
                className={`navbar-icon-btn navbar-notif-btn ${showNotifications ? 'notif-open' : ''}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="navbar-notif-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  width: 'min(380px, calc(100vw - 20px))',
                  maxHeight: 'calc(100vh - 70px)',
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(20px)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'fadeInUp 0.25s ease-out'
                }}>
                  {/* Popover Header */}
                  <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bell size={16} color="var(--color-primary)" />
                      <span style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '14px' }}>{t('notifications.title', 'Notifications')}</span>
                      {unreadCount > 0 && (
                        <span style={{
                          background: 'var(--color-error-bg)',
                          color: 'var(--color-error)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>{unreadCount} {t('notifications.unread', 'New')}</span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >{t('notifications.markAllRead', 'Mark all read')}</button>
                    )}
                  </div>

                  {/* Filter Sub-header Tabs */}
                  <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    padding: '4px'
                  }}>
                    <button
                      onClick={() => setNotifFilter('all')}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: notifFilter === 'all' ? 'var(--color-elevated)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: notifFilter === 'all' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {t('common.all', 'All')} ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter('unread')}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: notifFilter === 'unread' ? 'var(--color-elevated)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: notifFilter === 'unread' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {t('notifications.unread', 'Unread')} ({unreadCount})
                    </button>
                  </div>

                  {/* Notification Items List */}
                  <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '8px' }}>
                    {notifications.filter(n => notifFilter === 'all' || !n.IsRead).length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 10px', fontSize: '13px' }}>
                        <Inbox size={32} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
                        <div>{notifFilter === 'unread' ? t('notifications.noUnread', 'No unread notifications') : t('notifications.noNotifications', 'No notifications yet')}</div>
                      </div>
                    ) : notifications
                      .filter(n => notifFilter === 'all' || !n.IsRead)
                      .map((n) => {
                        const isUnread = !n.IsRead;
                        return (
                          <div
                            key={n.UserNotificationID}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              marginBottom: '4px',
                              background: isUnread ? 'var(--bg-tertiary)' : 'transparent',
                              borderLeft: isUnread ? '3px solid var(--accent-primary)' : '3px solid transparent',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                            onMouseLeave={(e) => { if (!isUnread) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                              <div style={{ marginTop: '2px' }}>
                                {getNotifIcon(n.TypeCode)}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: isUnread ? 700 : 500 }}>
                                      {n.Title}
                                    </span>
                                    {n.PriorityCode && (
                                      <span style={{
                                        fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase',
                                        background: n.PriorityCode === 'CRITICAL' ? 'rgba(239, 68, 68, 0.18)' : n.PriorityCode === 'HIGH' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                                        color: n.PriorityCode === 'CRITICAL' ? '#ef4444' : n.PriorityCode === 'HIGH' ? '#f59e0b' : '#3b82f6'
                                      }}>
                                        {n.PriorityCode}
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', whiteSpace: 'nowrap' }}>
                                    {formatRelativeTime(n.CreatedDate || n.NotificationDate)}
                                  </span>
                                </div>
                                <p style={{ margin: '2px 0 4px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.4 }}>
                                  {n.MessageText}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '4px' }}>
                                  {n.RequestNumber && (
                                    <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                                      #{n.RequestNumber}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                    {t('notifications.viewDetails', 'View Details →')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isUnread && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkSingleRead(n.UserNotificationID);
                                }}
                                title={t('notifications.markAllRead', 'Mark as read')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Check size={14} color="var(--accent-primary)" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Popover Footer Navigation */}
                  <div style={{
                    padding: '10px 16px',
                    borderTop: '1px solid var(--glass-border)',
                    background: 'var(--bg-tertiary)',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        handleNav('notifications/inbox');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {t('notifications.viewAllInCenter', 'View All in Notification Center →')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Circle & Dropdown Menu */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title={`${user?.firstName || user?.FirstName || 'User'} ${user?.lastName || user?.LastName || ''}`}
                aria-label={t('auth.profileSettings', 'Account & Profile Settings')}
                aria-expanded={showProfileMenu}
                className={`navbar-profile-trigger ${showProfileMenu ? 'profile-open' : ''}`}
              >
                <div className="navbar-avatar-circle">
                  {(user?.avatarUrl || user?.AvatarUrl) ? (
                    <img
                      src={user.avatarUrl || user.AvatarUrl}
                      alt="Avatar"
                      className="navbar-avatar-img"
                    />
                  ) : (
                    <div className="navbar-avatar-fallback">
                      {user ? `${(user.firstName || user.FirstName || 'U').charAt(0)}${(user.lastName || user.LastName || '').charAt(0)}`.toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <span className="navbar-presence-dot" title="Active" />
              </button>

              {/* Profile Dropdown Drawer */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '52px',
                  right: 0,
                  width: 'min(290px, calc(100vw - 20px))',
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 48px -4px rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'fadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  padding: '8px'
                }}>
                  <div style={{
                    padding: '14px 14px',
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: '6px',
                    background: 'var(--color-surface)',
                    borderRadius: '12px 12px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '2px solid var(--color-primary)',
                      boxShadow: '0 0 10px rgba(37, 99, 235, 0.25)'
                    }}>
                      {(user?.avatarUrl || user?.AvatarUrl) ? (
                        <img src={user.avatarUrl || user.AvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.95rem'
                        }}>
                          {user ? `${(user.firstName || user.FirstName || 'U').charAt(0)}${(user.lastName || user.LastName || '').charAt(0)}`.toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.firstName || user?.FirstName || user?.Username || 'User'} {user?.lastName || user?.LastName || ''}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email || user?.Email || 'user@system.com'}
                      </div>
                      <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', color: 'var(--color-primary)' }}>
                          {user?.userTypeCode || 'Employee'}
                        </span>
                        {user?.TenantName && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: 'var(--color-elevated)', color: 'var(--text-secondary)' }}>
                            🏢 {user.TenantName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '3px' }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate('profile');
                      }}
                      className="profile-menu-item"
                    >
                      <User size={16} color="var(--color-primary)" />
                      <span>{t('profile.myProfile', 'My Profile & Settings')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate('profile?tab=notifications');
                      }}
                      className="profile-menu-item"
                    >
                      <Sliders size={16} color="var(--color-info)" />
                      <span>{t('nav.notificationPreferences', 'Notification Preferences')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate('profile?tab=security');
                      }}
                      className="profile-menu-item"
                    >
                      <Lock size={16} color="var(--color-success)" />
                      <span>{t('auth.profileSettings', 'Password & Security')}</span>
                    </button>

                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="profile-menu-item-danger"
                    >
                      <LogOut size={16} color="#ef4444" />
                      <span>{t('auth.signOut', 'Sign Out')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="app-main-content">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (WCAG 2.2 AA compliant thumb navigation for mobile viewports) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className={`mobile-bottom-nav-btn ${currentPath === '/' || currentPath === '/dashboard' ? 'active' : ''}`}
          aria-label={t('nav.dashboard', 'Dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>{t('nav.dashboard', 'Dashboard')}</span>
        </button>

        {/* 2. Tasks / Requests / Queue (Role Adaptive) */}
        <button
          type="button"
          onClick={() => {
            const role = (user?.userTypeCode || '').toUpperCase();
            if (role === 'TECHNICIAN') handleNav('technician/assigned');
            else if (role === 'DEPARTMENT_MANAGER') handleNav('approval/queue');
            else handleNav('issues/my-requests');
          }}
          className={`mobile-bottom-nav-btn ${
            currentPath.includes('my-requests') || currentPath.includes('technician') || currentPath.includes('approval')
              ? 'active'
              : ''
          }`}
          aria-label={
            (user?.userTypeCode || '').toUpperCase() === 'TECHNICIAN'
              ? 'Workbench'
              : (user?.userTypeCode || '').toUpperCase() === 'DEPARTMENT_MANAGER'
              ? 'Approvals'
              : t('issues.myRequests', 'Requests')
          }
        >
          {(user?.userTypeCode || '').toUpperCase() === 'TECHNICIAN' ? (
            <Wrench size={20} />
          ) : (user?.userTypeCode || '').toUpperCase() === 'DEPARTMENT_MANAGER' ? (
            <ShieldCheck size={20} />
          ) : (
            <LifeBuoy size={20} />
          )}
          <span>
            {(user?.userTypeCode || '').toUpperCase() === 'TECHNICIAN'
              ? 'Workbench'
              : (user?.userTypeCode || '').toUpperCase() === 'DEPARTMENT_MANAGER'
              ? 'Approvals'
              : 'Requests'}
          </span>
        </button>

        {/* 3. Primary Quick Action (Submit New Request) */}
        <button
          type="button"
          onClick={() => handleNav('issues/create')}
          className="mobile-bottom-nav-btn"
          aria-label={t('issues.submitNew', 'New Request')}
          style={{ transform: 'translateY(-6px)' }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}>
            <Plus size={22} />
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, marginTop: '2px' }}>New</span>
        </button>

        {/* 4. Notifications with Badge */}
        <button
          type="button"
          onClick={() => handleNav('notifications/inbox')}
          className={`mobile-bottom-nav-btn ${currentPath.includes('notifications') ? 'active' : ''}`}
          aria-label={t('notifications.title', 'Notifications')}
        >
          <div style={{ position: 'relative' }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="mobile-bottom-nav-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span>{t('notifications.title', 'Alerts')}</span>
        </button>

        {/* 5. Menu Drawer Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={`mobile-bottom-nav-btn ${mobileMenuOpen ? 'active' : ''}`}
          aria-label={t('nav.menu', 'Menu')}
        >
          <Menu size={20} />
          <span>{t('nav.menu', 'Menu')}</span>
        </button>
      </nav>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={!!selectedNotifDetail}
        notification={selectedNotifDetail}
        onClose={() => setSelectedNotifDetail(null)}
        onMarkRead={handleMarkSingleRead}
        onMarkUnread={handleMarkSingleUnread}
        onNavigateToResource={handleNavigateToResource}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── Modern Enterprise Navbar Styling ─── */
        .top-navbar {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .navbar-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .navbar-search-input {
          height: 38px;
          padding: 7px 34px 7px 36px !important;
          border-radius: 20px !important;
          background: var(--color-elevated) !important;
          border: 1.5px solid var(--color-border) !important;
          color: var(--color-text) !important;
          font-size: 0.83rem !important;
          width: 240px !important;
          outline: none !important;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .navbar-search-input:hover {
          border-color: rgba(37, 99, 235, 0.45) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .navbar-search-input:focus {
          width: 290px !important;
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.2), 0 4px 14px rgba(0, 0, 0, 0.08) !important;
          background: var(--color-surface) !important;
        }

        .search-shortcut-badge {
          position: absolute;
          right: 12px;
          font-size: 11px;
          padding: 1px 6px;
          border-radius: 4px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          font-family: monospace;
          pointer-events: none;
          line-height: 1.2;
        }

        .navbar-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          cursor: pointer;
          position: relative;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .navbar-icon-btn:hover {
          transform: translateY(-1.5px) scale(1.05);
          color: var(--color-text);
          border-color: var(--color-primary);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.22), 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .navbar-icon-btn:active {
          transform: scale(0.96);
        }

        .navbar-theme-btn.theme-dark:hover {
          border-color: #60a5fa;
          color: #60a5fa;
          box-shadow: 0 0 16px rgba(96, 165, 250, 0.4);
        }

        .navbar-theme-btn.theme-light:hover {
          border-color: #f59e0b;
          color: #f59e0b;
          box-shadow: 0 0 16px rgba(245, 158, 11, 0.35);
        }

        .navbar-theme-btn svg {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .navbar-theme-btn:hover svg {
          transform: rotate(20deg) scale(1.1);
        }

        .navbar-notif-btn.notif-open {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
        }

        .navbar-notif-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
          animation: pulsePing 2s infinite ease-in-out;
        }

        @keyframes pulsePing {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* ─── Circular Profile Trigger ─── */
        .navbar-profile-trigger {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          padding: 0;
          position: relative;
          background: transparent;
          border: 2px solid var(--color-border);
          cursor: pointer;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .navbar-profile-trigger:hover,
        .navbar-profile-trigger.profile-open {
          transform: translateY(-1.5px) scale(1.06);
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.28), 0 6px 16px rgba(0, 0, 0, 0.18);
        }

        .navbar-profile-trigger:active {
          transform: scale(0.96);
        }

        .navbar-avatar-circle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .navbar-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .navbar-avatar-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.02em;
        }

        .navbar-presence-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid var(--color-elevated);
          box-shadow: 0 0 4px rgba(16, 185, 129, 0.5);
        }

        .profile-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
        }

        .profile-menu-item:hover {
          background: rgba(37, 99, 235, 0.08);
          color: var(--color-primary);
          transform: translateX(3px);
        }

        .profile-menu-item-danger {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          background: var(--color-error-bg);
          border: none;
          color: var(--color-error);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
        }

        .profile-menu-item-danger:hover {
          background: rgba(239, 68, 68, 0.15);
          transform: translateX(3px);
        }

        .app-main-content {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 16px 14px calc(var(--mobile-bottom-nav-height, 64px) + var(--safe-area-bottom, 0px) + 20px) 14px;
        }

        @media (min-width: 640px) {
          .app-main-content {
            padding: 22px 20px calc(var(--mobile-bottom-nav-height, 64px) + var(--safe-area-bottom, 0px) + 20px) 20px;
          }
        }

        @media (min-width: 768px) {
          .app-main-content {
            padding: 24px 28px;
          }
          .mobile-bottom-nav {
            display: none !important;
          }
        }

        @media (min-width: 1024px) {
          .app-main-content {
            padding: 32px 36px;
          }
        }

        @media (max-width: 640px) {
          .top-navbar {
            height: 58px !important;
          }
          .header-search-input {
            width: 120px !important;
          }
        }

        @media (max-width: 1024px) {
          .app-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            height: 100vh !important;
            z-index: 100 !important;
            transform: translateX(-100%);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
          }
          .app-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .mobile-nav-toggle {
            display: inline-flex !important;
          }
          .mobile-drawer-close-btn {
            display: inline-flex !important;
          }
          .desktop-sidebar-toggle-btn {
            display: none !important;
          }
          .header-search-input {
            width: 140px !important;
          }
        }

        @media (min-width: 1025px) {
          .mobile-nav-toggle {
            display: none !important;
          }
          .mobile-drawer-close-btn {
            display: none !important;
          }
          .desktop-sidebar-toggle-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
}
