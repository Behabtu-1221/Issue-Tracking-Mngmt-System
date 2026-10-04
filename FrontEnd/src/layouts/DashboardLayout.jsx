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
import { useTranslation, LanguageSelector } from '../i18n';

export default function DashboardLayout({ children, activeMenu = 'parks', onNavigate }) {
  const { t, isRTL } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const currentSearch = location.search;
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleNav = (target) => {
    if (onNavigate) {
      onNavigate(target.startsWith('/') ? target.slice(1) : target);
    } else {
      navigate(target.startsWith('/') ? target : `/${target}`);
    }
  };

  const fetchNotifications = async () => {
    try {
      const [inboxRes, countRes] = await Promise.all([
        notificationApi.getInbox({ limit: 20 }),
        notificationApi.getUnreadCount()
      ]);
      const rawList = inboxRes.data?.data || inboxRes.data?.notifications || (Array.isArray(inboxRes.data) ? inboxRes.data : []);
      setNotifications(Array.isArray(rawList) ? rawList : []);
      const unread = countRes.data?.data?.unreadCount ?? countRes.data?.unreadCount ?? 0;
      setUnreadCount(Number(unread));
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

    if (type.startsWith('APPROVAL') || table === 'Approval') {
      handleNav(`approvals/queue${param}`);
    } else if (type === 'ISSUE_ASSIGNED' && (role === 'TECHNICIAN' || user?.isTechnician)) {
      handleNav(resourceId ? `technician/request/${resourceId}` : 'technician/assigned');
    } else if (type === 'APPROVAL_COMPLETED' && (role === 'DISPATCHER' || role === 'DEPARTMENT_MANAGER')) {
      handleNav(`dispatch/queue${param}`);
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
    (activeRoleCode === 'EMPLOYEE') ||
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
      { id: 'notifications/preferences', tabId: 'preferences', label: 'Delivery Preferences', icon: Sliders },
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
      { id: 'notifications/preferences', tabId: 'preferences', label: 'Delivery Preferences', icon: Sliders },
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
    { id: 'issues/known', label: 'Knowledge Base', icon: BookOpen },
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
      { id: 'services/category-mappings', tabId: 'category-mappings', label: 'Category Mappings', icon: Tag, permission: 'Service.Read' },
      { id: 'services/pricing', tabId: 'pricing', label: 'Pricing & Billing', icon: DollarSign, permission: 'Service.Read' },
      { id: 'services/requirements', tabId: 'requirements', label: 'Form & Requirements', icon: FileText, permission: 'Service.Read' },
      { id: 'services/governance', tabId: 'governance', label: 'Governance & SLA', icon: ShieldCheck, permission: 'Service.Read' }
    ]
  };

  const employeeServiceCatalogItem = {
    id: 'services',
    label: 'Service Catalog',
    icon: BookOpen,
    permission: 'Service.Read',
    children: [
      { id: 'services/dashboard', tabId: 'dashboard', label: 'Catalog Overview', icon: BarChart2, permission: 'Service.Read' },
      { id: 'services/directory', tabId: 'directory', label: 'Service Directory', icon: Layers, permission: 'Service.Read' }
    ]
  };

  const employeeMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    employeeServiceCatalogItem,
    {
      id: 'issues',
      label: 'My Requests',
      icon: LifeBuoy,
      children: [
        { id: 'issues/create', tabId: 'create', label: 'Create Request', icon: Plus },
        { id: 'issues/my-requests', tabId: 'my-requests', label: 'My Requests', icon: ListChecks },
        { id: 'issues/history', tabId: 'history', label: 'Request History', icon: History }
      ]
    },
    standardCommunicationMenuItem,
    { id: 'issues/known', label: 'Knowledge Base', icon: BookOpen },
    userNotificationMenuItem,
    { id: 'profile', label: 'Profile', icon: UserCircle }
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
    { id: 'issues/known', label: 'Knowledge Base', icon: BookOpen },
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
        { id: 'issues/history', tabId: 'history', label: 'Request History', icon: History },
        { id: 'issues/known', tabId: 'known', label: 'Knowledge Base & FAQs', icon: BookOpen }
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
        { id: 'issues/status-flow', tabId: 'status-flow', label: 'Status Lifecycle', icon: RefreshCw, permission: 'Issue.Read.Company' },
        { id: 'issues/known', tabId: 'known', label: 'Known Issues & KB', icon: BookOpen, permission: 'Knowledge.Read' }
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
      'services/pricing': 'nav.pricingBilling',
      'services/requirements': 'nav.serviceRequirements',
      'services/governance': 'nav.serviceGovernance',
      'issues': 'nav.issues',
      'issues/dashboard': 'nav.issuesOverview',
      'issues/tracker': 'nav.issuesTracker',
      'issues/create': 'nav.createRequest',
      'issues/my-requests': 'nav.myRequests',
      'issues/history': 'nav.requestHistory',
      'issues/status-flow': 'nav.statusFlow',
      'issues/known': 'nav.knownIssues',
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
      'technician/dashboard': 'nav.assignedWork',
      'technician/assigned': 'nav.assignedWork',
      'technician/resolved': 'nav.workHistory'
    };

    const translationKey = keyMap[item.id];
    return translationKey ? t(translationKey, item.label) : item.label;
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
      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? '72px' : '260px',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        zIndex: 10
      }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(47, 129, 247, 0.35)',
                  flexShrink: 0
                }}>
                  <img
                    src="/logoitms.png"
                    alt="ITMS Logo"
                    style={{ width: '26px', height: '26px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                  />
                </div>
                <span style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: '800',
                  fontSize: '1.2rem',
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)'
                }}>
                  ITMS
                </span>
              </div>

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title="Toggle Sidebar Menu"
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
            </>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Expand Sidebar Menu"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--accent-gradient)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(47, 129, 247, 0.35)'
              }}
            >
              <Menu size={20} />
            </button>
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
            const isParentActive = activeMenu === item.id || currentPath.endsWith(`/${item.id}`) || isChildActive;

            const isSearching = searchQuery.trim().length > 0;
            const isExpanded = isSearching ? true : !!expandedItems[item.id];

            return (
              <div key={item.id} style={{ marginBottom: '6px' }}>
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
                    fontWeight: '800'
                  }}
                  title={sidebarCollapsed ? getLocalizedLabel(item) : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color={isParentActive ? '#ffffff' : 'var(--color-primary)'} />
                    {!sidebarCollapsed && (
                      <span style={{ fontWeight: '800', color: isParentActive && !isChildActive ? '#ffffff' : 'var(--text-primary)', fontSize: '0.9rem' }}>
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
        <header style={{
          height: '70px',
          borderBottom: '1px solid var(--glass-border)',
          background: theme === 'dark' ? 'rgba(23, 27, 33, 0.88)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
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
                style={{
                  padding: searchQuery ? '8px 36px 8px 40px' : '8px 16px 8px 40px',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  width: '280px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title={t('common.clear', 'Clear search')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                >
                  <X size={14} />
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
              title={theme === 'dark' ? t('theme.switchToLight', 'Switch to Bright/Light Theme') : t('theme.switchToDark', 'Switch to Dark Theme')}
              style={{
                padding: '10px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--sidebar-border)',
                color: theme === 'dark' ? 'var(--color-warning)' : 'var(--color-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: theme === 'dark' ? '0 0 12px rgba(242, 176, 30, 0.25)' : '0 0 12px rgba(47, 129, 247, 0.25)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Button & Drawer */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                style={{
                  padding: '10px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'var(--color-error)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '800',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(229, 72, 77, 0.5)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  width: '380px',
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
                      Unread ({unreadCount})
                    </button>
                  </div>

                  {/* Notification Items List */}
                  <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '8px' }}>
                    {notifications.filter(n => notifFilter === 'all' || !n.IsRead).length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 10px', fontSize: '13px' }}>
                        <Inbox size={32} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
                        <div>{notifFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</div>
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
                                    <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: isUnread ? 700 : 500 }}>
                                      {n.Title}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', whiteSpace: 'nowrap' }}>
                                      {formatRelativeTime(n.CreatedDate || n.NotificationDate)}
                                    </span>
                                  </div>
                                  <p style={{ margin: '2px 0 4px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.4 }}>
                                    {n.MessageText}
                                  </p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                      View Details →
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
                                  title="Mark as read"
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
                      View All in Notification Center →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar & Dropdown Menu */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title="Account & Profile Settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  padding: '4px 12px 4px 6px',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {(user?.avatarUrl || user?.AvatarUrl) ? (
                  <img
                    src={user.avatarUrl || user.AvatarUrl}
                    alt="Avatar"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      boxShadow: '0 0 8px rgba(138, 75, 255, 0.4)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    boxShadow: '0 0 8px rgba(47, 129, 247, 0.35)'
                  }}>
                    {user ? `${(user.firstName || user.FirstName || 'U').charAt(0)}${(user.lastName || user.LastName || '').charAt(0)}`.toUpperCase() : 'U'}
                  </div>
                )}
                <div style={{ textAlign: 'left', display: 'none', mdDisplay: 'block' }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.2 }}>
                    {user?.firstName || user?.FirstName || 'User'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {user?.userTypeCode || 'Member'}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" style={{ transform: showProfileMenu ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>

              {/* Profile Dropdown Drawer */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  width: '260px',
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(20px)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'fadeInUp 0.25s ease-out',
                  padding: '8px'
                }}>
                  <div style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: '6px'
                  }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                      {user?.firstName || user?.FirstName || 'User'} {user?.lastName || user?.LastName || ''}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px', wordBreak: 'break-all' }}>
                      {user?.email || user?.Email || 'user@system.com'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '2px' }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate('profile');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <User size={16} color="var(--color-primary)" />
                      <span>{t('profile.myProfile', 'My Profile & Settings')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate('profile');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: isRTL ? 'right' : 'left'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Bell size={16} color="var(--color-info)" />
                      <span>{t('nav.notificationPreferences', 'Notification Preferences')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate('profile');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: isRTL ? 'right' : 'left'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--color-error-bg)',
                        border: 'none',
                        color: 'var(--color-error)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: isRTL ? 'right' : 'left'
                      }}
                    >
                      <LogOut size={16} color="var(--color-error)" />
                      <span>{t('auth.signOut', 'Sign Out')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ flex: 1, minHeight: 0, padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={!!selectedNotifDetail}
        notification={selectedNotifDetail}
        onClose={() => setSelectedNotifDetail(null)}
        onMarkRead={handleMarkSingleRead}
        onNavigateToResource={handleNavigateToResource}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
