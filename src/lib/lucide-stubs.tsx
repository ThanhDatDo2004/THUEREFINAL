import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const ICON_MAP: Record<string, React.ReactNode> = {
  Activity: (
    <>
      <path key="p1" d="M22 12h-4l-3 8L9 4l-3 12H2" />
    </>
  ),
  AlertCircle: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <line key="l1" x1="12" y1="8" x2="12" y2="12" />
      <circle key="c2" cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  AlertTriangle: (
    <>
      <path key="p1" d="M10.3 3.5 1.4 19a1 1 0 0 0 .9 1.5h19.4a1 1 0 0 0 .9-1.5L13.4 3.5a1 1 0 0 0-1.8 0z" />
      <line key="l1" x1="12" y1="9" x2="12" y2="13" />
      <circle key="c1" cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  ArrowLeft: (
    <>
      <line key="l1" x1="19" y1="12" x2="5" y2="12" />
      <polyline key="p1" points="12 5 5 12 12 19" />
    </>
  ),
  ArrowRight: (
    <>
      <line key="l1" x1="5" y1="12" x2="19" y2="12" />
      <polyline key="p1" points="12 5 19 12 12 19" />
    </>
  ),
  ArrowUpRight: (
    <>
      <line key="l1" x1="7" y1="17" x2="17" y2="7" />
      <polyline key="p1" points="7 7 17 7 17 17" />
    </>
  ),
  Award: (
    <>
      <circle key="c1" cx="12" cy="8" r="4" />
      <path key="p1" d="M8.5 11.5 7 22l5-3 5 3-1.5-10.5" />
    </>
  ),
  BadgePercent: (
    <>
      <circle key="c1" cx="7" cy="7" r="1.5" />
      <circle key="c2" cx="17" cy="17" r="1.5" />
      <line key="l1" x1="8.5" y1="15.5" x2="15.5" y2="8.5" />
      <path key="p1" d="M5 3h14l2 4-2 4 2 4-2 4H5l-2-4 2-4-2-4z" />
    </>
  ),
  Ban: (
    <>
      <circle key="c1" cx="12" cy="12" r="9" />
      <line key="l1" x1="5" y1="5" x2="19" y2="19" />
    </>
  ),
  BarChart3: (
    <>
      <line key="l1" x1="4" y1="20" x2="4" y2="10" />
      <line key="l2" x1="10" y1="20" x2="10" y2="4" />
      <line key="l3" x1="16" y1="20" x2="16" y2="14" />
      <line key="l4" x1="22" y1="20" x2="2" y2="20" />
    </>
  ),
  Building: (
    <>
      <rect key="r1" x="4" y="2" width="16" height="20" rx="2" />
      <path key="p1" d="M9 6h2v2H9zM13 6h2v2h-2zM9 10h2v2H9zM13 10h2v2h-2zM9 14h2v2H9zM13 14h2v2h-2z" />
      <path key="p2" d="M4 18h16" />
    </>
  ),
  Building2: (
    <>
      <path key="p1" d="M6 22V2h12v20" />
      <path key="p2" d="M6 6h12" />
      <path key="p3" d="M6 10h12" />
      <path key="p4" d="M10 14h4" />
      <path key="p5" d="M10 18h4" />
    </>
  ),
  Calendar: (
    <>
      <rect key="r1" x="3" y="4" width="18" height="18" rx="2" />
      <line key="l1" x1="3" y1="10" x2="21" y2="10" />
      <line key="l2" x1="8" y1="2" x2="8" y2="6" />
      <line key="l3" x1="16" y1="2" x2="16" y2="6" />
    </>
  ),
  CalendarClock: (
    <>
      <rect key="r1" x="3" y="4" width="18" height="12" rx="2" />
      <line key="l1" x1="3" y1="10" x2="21" y2="10" />
      <line key="l2" x1="8" y1="2" x2="8" y2="6" />
      <line key="l3" x1="16" y1="2" x2="16" y2="6" />
      <circle key="c1" cx="12" cy="18" r="4" />
      <path key="p1" d="M12 16v2.5l1.5 1" />
    </>
  ),
  CalendarRange: (
    <>
      <rect key="r1" x="3" y="4" width="18" height="16" rx="2" />
      <line key="l1" x1="3" y1="10" x2="21" y2="10" />
      <line key="l2" x1="8" y1="2" x2="8" y2="6" />
      <line key="l3" x1="16" y1="2" x2="16" y2="6" />
      <rect key="r2" x="7.5" y="13" width="3" height="3" rx="0.5" />
      <rect key="r3" x="13.5" y="13" width="3" height="3" rx="0.5" />
    </>
  ),
  Check: (
    <polyline key="p1" points="6 12 10.5 16 18 8" />
  ),
  CheckCircle: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <polyline key="p1" points="8 12 11 15 16 9" />
    </>
  ),
  CheckCircle2: (
    <>
      <path key="p0" d="M4 12a8 8 0 1 1 8 8" />
      <polyline key="p1" points="8 12 11 15 16 9" />
    </>
  ),
  ChevronDown: (
    <polyline key="p1" points="6 9 12 15 18 9" />
  ),
  ChevronLeft: (
    <polyline key="p1" points="15 6 9 12 15 18" />
  ),
  ChevronRight: (
    <polyline key="p1" points="9 6 15 12 9 18" />
  ),
  Clock: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <path key="p1" d="M12 6v6l4 2" />
    </>
  ),
  Clock3: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <path key="p1" d="M12 6v6l3 2" />
    </>
  ),
  Compass: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <polygon key="p1" points="16 8 11 11 8 16 13 13" />
      <circle key="c2" cx="12" cy="12" r="1" />
    </>
  ),
  Copy: (
    <>
      <rect key="r1" x="9" y="9" width="11" height="11" rx="2" />
      <rect key="r2" x="4" y="4" width="11" height="11" rx="2" />
    </>
  ),
  CreditCard: (
    <>
      <rect key="r1" x="2" y="5" width="20" height="14" rx="2" />
      <line key="l1" x1="2" y1="10" x2="22" y2="10" />
      <line key="l2" x1="6" y1="15" x2="9" y2="15" />
      <circle key="c1" cx="18" cy="15" r="1" />
    </>
  ),
  DollarSign: (
    <>
      <line key="l1" x1="12" y1="2" x2="12" y2="22" />
      <path key="p1" d="M17 7a5 5 0 0 0-5-3H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6h-4a5 5 0 0 1-5-3" />
    </>
  ),
  Download: (
    <>
      <line key="l1" x1="12" y1="5" x2="12" y2="15" />
      <polyline key="p1" points="7 10 12 15 17 10" />
      <line key="l2" x1="5" y1="19" x2="19" y2="19" />
    </>
  ),
  Edit: (
    <>
      <path key="p1" d="M12 20h9" />
      <path key="p2" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4z" />
    </>
  ),
  ExternalLink: (
    <>
      <path key="p1" d="M15 3h6v6" />
      <path key="p2" d="M10 14 21 3" />
      <rect key="r1" x="3" y="9" width="12" height="12" rx="2" />
    </>
  ),
  Eye: (
    <>
      <path key="p1" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle key="c1" cx="12" cy="12" r="3" />
    </>
  ),
  EyeOff: (
    <>
      <path key="p1" d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.36-5.64" />
      <path key="p2" d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.9 21.9 0 0 1-2.23 3.34" />
      <line key="l1" x1="1" y1="1" x2="23" y2="23" />
      <circle key="c1" cx="12" cy="12" r="3" />
    </>
  ),
  FileClock: (
    <>
      <path key="p1" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5.5" />
      <path key="p2" d="M14 2v6h6" />
      <circle key="c1" cx="17" cy="17" r="4" />
      <path key="p3" d="M17 15v2l1.5 1" />
    </>
  ),
  FileText: (
    <>
      <path key="p1" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path key="p2" d="M14 2v6h6" />
      <line key="l1" x1="8" y1="13" x2="16" y2="13" />
      <line key="l2" x1="8" y1="17" x2="14" y2="17" />
    </>
  ),
  Filter: (
    <>
      <polygon key="p1" points="3 4 21 4 14 12 14 20 10 18 10 12 3 4" />
    </>
  ),
  Hash: (
    <>
      <line key="l1" x1="5" y1="9" x2="19" y2="9" />
      <line key="l2" x1="5" y1="15" x2="19" y2="15" />
      <line key="l3" x1="9" y1="5" x2="9" y2="19" />
      <line key="l4" x1="15" y1="5" x2="15" y2="19" />
    </>
  ),
  Heart: (
    <path key="p1" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
  ),
  History: (
    <>
      <path key="p1" d="M3 3v5h5" />
      <path key="p2" d="M3.05 13A9 9 0 1 0 6 5.3" />
      <path key="p3" d="M12 7v5l3 2" />
    </>
  ),
  KeyRound: (
    <>
      <circle key="c1" cx="7.5" cy="7.5" r="3.5" />
      <path key="p1" d="M10.8 10.8 21 21" />
      <line key="l1" x1="14" y1="15" x2="17" y2="12" />
    </>
  ),
  Layers: (
    <>
      <path key="p1" d="m12 2 9 5-9 5-9-5 9-5z" />
      <path key="p2" d="m3 12 9 5 9-5" />
      <path key="p3" d="m3 17 9 5 9-5" />
    </>
  ),
  LayoutDashboard: (
    <>
      <rect key="r1" x="3" y="3" width="8" height="8" rx="1" />
      <rect key="r2" x="13" y="3" width="8" height="5" rx="1" />
      <rect key="r3" x="13" y="10" width="8" height="11" rx="1" />
      <rect key="r4" x="3" y="13" width="8" height="8" rx="1" />
    </>
  ),
  LineChart: (
    <>
      <polyline key="p1" points="3 17 9 11 13 15 21 7" />
      <line key="l1" x1="3" y1="3" x2="3" y2="21" />
      <line key="l2" x1="3" y1="21" x2="21" y2="21" />
    </>
  ),
  Loader: (
    <>
      <path key="p1" d="M12 2v4" />
      <path key="p2" d="M12 18v4" />
      <path key="p3" d="M4.93 4.93l2.83 2.83" />
      <path key="p4" d="M16.24 16.24l2.83 2.83" />
      <path key="p5" d="M2 12h4" />
      <path key="p6" d="M18 12h4" />
      <path key="p7" d="M4.93 19.07l2.83-2.83" />
      <path key="p8" d="M16.24 7.76l2.83-2.83" />
    </>
  ),
  Loader2: (
    <>
      <circle key="c1" cx="12" cy="12" r="9" />
      <path key="p1" d="M12 3v6" />
    </>
  ),
  Lock: (
    <>
      <rect key="r1" x="5" y="11" width="14" height="10" rx="2" />
      <path key="p1" d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle key="c1" cx="12" cy="16" r="1.5" />
    </>
  ),
  LogIn: (
    <>
      <path key="p1" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline key="p2" points="10 17 15 12 10 7" />
      <line key="l1" x1="15" y1="12" x2="3" y2="12" />
    </>
  ),
  LogOut: (
    <>
      <path key="p1" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline key="p2" points="16 17 21 12 16 7" />
      <line key="l1" x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  Mail: (
    <>
      <rect key="r1" x="3" y="6" width="18" height="12" rx="2" />
      <polyline key="p1" points="3 8.5 12 14 21 8.5" />
    </>
  ),
  MapPin: (
    <>
      <path key="p1" d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
      <circle key="c1" cx="12" cy="11" r="2.5" />
    </>
  ),
  MessageSquare: (
    <>
      <rect key="r1" x="3" y="5" width="18" height="14" rx="2" />
      <path key="p1" d="M7 19v4l4-4" />
    </>
  ),
  Pause: (
    <>
      <rect key="r1" x="6" y="4" width="4" height="16" rx="1" />
      <rect key="r2" x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  Pencil: (
    <>
      <path key="p1" d="M18 2l4 4-12 12-4 1 1-4 12-12z" />
      <path key="p2" d="M16 4l4 4" />
    </>
  ),
  Percent: (
    <>
      <line key="l1" x1="5" y1="19" x2="19" y2="5" />
      <circle key="c1" cx="6.5" cy="6.5" r="2.5" />
      <circle key="c2" cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  Phone: (
    <path
      key="p1"
      d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 4h8"
    />
  ),
  PhoneCall: (
    <>
      <path key="p1" d="M22 16.92V21a1 1 0 0 1-1.1 1 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3 2.1 1 1 0 0 1 4 1h4.09a1 1 0 0 1 1 .75l1.2 4.8a1 1 0 0 1-.29.95l-2.2 2.2a16 16 0 0 0 6 6l2.2-2.2a1 1 0 0 1 .95-.29l4.8 1.2a1 1 0 0 1 .75 1z" />
      <path key="p2" d="M15 5a5 5 0 0 1 5 5" />
      <path key="p3" d="M15 1a9 9 0 0 1 9 9" />
    </>
  ),
  Play: (
    <polygon key="p1" points="7 4 19 12 7 20 7 4" />
  ),
  Plus: (
    <>
      <line key="l1" x1="12" y1="5" x2="12" y2="19" />
      <line key="l2" x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  QrCode: (
    <>
      <rect key="r1" x="3" y="3" width="6" height="6" rx="1" />
      <rect key="r2" x="15" y="3" width="6" height="6" rx="1" />
      <rect key="r3" x="3" y="15" width="6" height="6" rx="1" />
      <path key="p1" d="M15 15h6v6h-6z" />
      <path key="p2" d="M9 5h6M5 9v6" />
    </>
  ),
  Quote: (
    <>
      <path key="p1" d="M7 17a4 4 0 0 1-4-4V7h4z" />
      <path key="p2" d="M21 17a4 4 0 0 1-4-4V7h4z" />
    </>
  ),
  RefreshCcw: (
    <>
      <path key="p1" d="M3 2v6h6" />
      <path key="p2" d="M21 12a9 9 0 0 0-15-6.7L3 8" />
      <path key="p3" d="M21 22v-6h-6" />
      <path key="p4" d="M3 12a9 9 0 0 0 15 6.7L21 16" />
    </>
  ),
  RefreshCw: (
    <>
      <path key="p1" d="M21 2v6h-6" />
      <path key="p2" d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path key="p3" d="M3 22v-6h6" />
      <path key="p4" d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </>
  ),
  Save: (
    <>
      <path key="p1" d="M5 21h14a2 2 0 0 0 2-2V7l-4-4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
      <path key="p2" d="M17 21v-8H7v8" />
      <path key="p3" d="M7 3v5h8" />
    </>
  ),
  ScanLine: (
    <>
      <path key="p1" d="M7 22H5a2 2 0 0 1-2-2v-2" />
      <path key="p2" d="M17 22h2a2 2 0 0 0 2-2v-2" />
      <path key="p3" d="M7 2H5a2 2 0 0 0-2 2v2" />
      <path key="p4" d="M17 2h2a2 2 0 0 1 2 2v2" />
      <path key="p5" d="M2 12h20" />
    </>
  ),
  Search: (
    <>
      <circle key="c1" cx="11" cy="11" r="7" />
      <line key="l1" x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  Send: (
    <path key="p1" d="M4 4l16 8-16 8 4-8z" />
  ),
  Settings: (
    <>
      <circle key="c1" cx="12" cy="12" r="3" />
      <path key="p1" d="M19.4 15a1.78 1.78 0 0 0 .35 1.94l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.78 1.78 0 0 0-1.94-.35 1.78 1.78 0 0 0-1 1.61V21a2 2 0 1 1-4 0v-.09a1.78 1.78 0 0 0-1-1.61 1.78 1.78 0 0 0-1.94.35l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.78 1.78 0 0 0 .35-1.94 1.78 1.78 0 0 0-1.61-1H3a2 2 0 1 1 0-4h.09a1.78 1.78 0 0 0 1.61-1 1.78 1.78 0 0 0-.35-1.94l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.78 1.78 0 0 0 1.94.35h.09A1.78 1.78 0 0 0 9 3.1V3a2 2 0 1 1 4 0v.09a1.78 1.78 0 0 0 1 1.61h.09a1.78 1.78 0 0 0 1.94-.35l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.78 1.78 0 0 0-.35 1.94v.09a1.78 1.78 0 0 0 1.61 1H21a2 2 0 1 1 0 4h-.09a1.78 1.78 0 0 0-1.61 1z" />
    </>
  ),
  Share2: (
    <>
      <circle key="c1" cx="18" cy="5" r="3" />
      <circle key="c2" cx="6" cy="12" r="3" />
      <circle key="c3" cx="18" cy="19" r="3" />
      <line key="l1" x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line key="l2" x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </>
  ),
  ShieldCheck: (
    <>
      <path key="p1" d="M12 22s7-3.5 7-10V5l-7-3-7 3v7c0 6.5 7 10 7 10z" />
      <polyline key="p2" points="9 12 12 15 17 9" />
    </>
  ),
  ShoppingCart: (
    <>
      <circle key="c1" cx="9" cy="20" r="1.5" />
      <circle key="c2" cx="17" cy="20" r="1.5" />
      <path key="p1" d="M3 4h2l3 12h10l2-8H7" />
    </>
  ),
  SlidersHorizontal: (
    <>
      <line key="l1" x1="3" y1="7" x2="21" y2="7" />
      <line key="l2" x1="3" y1="17" x2="21" y2="17" />
      <circle key="c1" cx="9" cy="7" r="2" />
      <circle key="c2" cx="15" cy="17" r="2" />
    </>
  ),
  Sparkles: (
    <>
      <path key="p1" d="M5 3l1.5 4.5L11 9 6.5 10.5 5 15l-1.5-4.5L0 9l3.5-1.5z" />
      <path key="p2" d="M19 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
      <path key="p3" d="M14 13l.75 2.25L17 16l-2.25.75L14 19l-.75-2.25L11 16l2.25-.75z" />
    </>
  ),
  Star: (
    <path
      key="p1"
      d="M12 2.5l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.1l6.2-.9z"
    />
  ),
  Store: (
    <>
      <path key="p1" d="M3 7h18l-1 4a4 4 0 0 1-4 3H8a4 4 0 0 1-4-3z" />
      <path key="p2" d="M5 7l-1-4h16l-1 4" />
      <path key="p3" d="M3 21h18" />
      <path key="p4" d="M7 14v7" />
      <path key="p5" d="M17 14v7" />
    </>
  ),
  TicketPercent: (
    <>
      <path key="p1" d="M3 5h18v4a2 2 0 0 0 0 6v4H3v-4a2 2 0 0 0 0-6z" />
      <line key="l1" x1="9" y1="9" x2="15" y2="15" />
      <circle key="c1" cx="9" cy="15" r="1" />
      <circle key="c2" cx="15" cy="9" r="1" />
    </>
  ),
  Timer: (
    <>
      <circle key="c1" cx="12" cy="14" r="8" />
      <path key="p1" d="M12 10v4l2 2" />
      <path key="p2" d="M9 2h6" />
      <path key="p3" d="M19.5 7.5l-1.5 1.5" />
    </>
  ),
  TimerReset: (
    <>
      <polyline key="p1" points="2 12 6 16 10 12" />
      <path key="p2" d="M6 16V9a7 7 0 1 1 7 7" />
    </>
  ),
  Trash2: (
    <>
      <path key="p1" d="M3 6h18" />
      <path key="p2" d="M7 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <rect key="r1" x="5" y="6" width="14" height="14" rx="2" />
      <line key="l1" x1="10" y1="11" x2="10" y2="17" />
      <line key="l2" x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  TrendingDown: (
    <>
      <polyline key="p1" points="21 7 13 15 9 11 3 17" />
      <polyline key="p2" points="21 11 21 7 17 7" />
    </>
  ),
  TrendingUp: (
    <>
      <polyline key="p1" points="3 17 9 11 13 15 21 7" />
      <polyline key="p2" points="14 7 21 7 21 14" />
    </>
  ),
  Trophy: (
    <>
      <path key="p1" d="M8 21h8" />
      <path key="p2" d="M12 17v4" />
      <path key="p3" d="M7 4h10l1 6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" />
      <path key="p4" d="M5 4v2a4 4 0 0 0 4 4" />
      <path key="p5" d="M19 4v2a4 4 0 0 1-4 4" />
    </>
  ),
  UploadCloud: (
    <>
      <path key="p1" d="M16 16l-4-4-4 4" />
      <line key="l1" x1="12" y1="12" x2="12" y2="21" />
      <path key="p2" d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 4 16.3" />
    </>
  ),
  User: (
    <>
      <path key="p1" d="M17 21v-2a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v2" />
      <circle key="c1" cx="12" cy="7" r="4" />
    </>
  ),
  UserPlus: (
    <>
      <path key="p1" d="M17 21v-2a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v2" />
      <circle key="c1" cx="12" cy="7" r="4" />
      <line key="l1" x1="19" y1="8" x2="19" y2="14" />
      <line key="l2" x1="16" y1="11" x2="22" y2="11" />
    </>
  ),
  Users: (
    <>
      <circle key="c1" cx="9" cy="7" r="4" />
      <path key="p1" d="M17 11a4 4 0 1 0-2-7.5" />
      <path key="p2" d="M2 21a7 7 0 0 1 14 0" />
      <path key="p3" d="M14 21a7 7 0 0 1 8 0" />
    </>
  ),
  Wallet: (
    <>
      <rect key="r1" x="2" y="6" width="20" height="14" rx="2" />
      <path key="p1" d="M18 6V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2" />
      <circle key="c1" cx="16" cy="13" r="1" />
    </>
  ),
  Wallet2: (
    <>
      <rect key="r1" x="3" y="7" width="18" height="12" rx="2" />
      <path key="p1" d="M3 11h18" />
      <circle key="c1" cx="16" cy="15" r="1" />
    </>
  ),
  Wrench: (
    <>
      <path key="p1" d="M14.7 5.3a5 5 0 1 0-1.4 1.4L3 17v4h4L17.7 10.7a5 5 0 0 0-3-5.4z" />
    </>
  ),
  X: (
    <>
      <line key="l1" x1="5" y1="5" x2="19" y2="19" />
      <line key="l2" x1="19" y1="5" x2="5" y2="19" />
    </>
  ),
  XCircle: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <line key="l1" x1="15" y1="9" x2="9" y2="15" />
      <line key="l2" x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  Zap: (
    <polyline key="p1" points="13 2 3 14 11 14 11 22 21 10 13 10 13 2" />
  ),
};

const createIcon = (displayName: string) => {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ className, ...props }, ref) => (
      <svg
        ref={ref}
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {ICON_MAP[displayName] ?? (
          <>
            <circle key="c1" cx="12" cy="12" r="9" />
            <line key="l1" x1="9" y1="12" x2="15" y2="12" />
            <line key="l2" x1="12" y1="9" x2="12" y2="15" />
          </>
        )}
      </svg>
    )
  );
  Icon.displayName = displayName;
  return Icon;
};

export const Activity = createIcon("Activity");
export const AlertCircle = createIcon("AlertCircle");
export const AlertTriangle = createIcon("AlertTriangle");
export const ArrowLeft = createIcon("ArrowLeft");
export const ArrowRight = createIcon("ArrowRight");
export const ArrowUpRight = createIcon("ArrowUpRight");
export const Award = createIcon("Award");
export const BadgePercent = createIcon("BadgePercent");
export const Ban = createIcon("Ban");
export const BarChart3 = createIcon("BarChart3");
export const Building = createIcon("Building");
export const Building2 = createIcon("Building2");
export const Calendar = createIcon("Calendar");
export const CalendarClock = createIcon("CalendarClock");
export const CalendarRange = createIcon("CalendarRange");
export const Check = createIcon("Check");
export const CheckCircle = createIcon("CheckCircle");
export const CheckCircle2 = createIcon("CheckCircle2");
export const ChevronDown = createIcon("ChevronDown");
export const ChevronLeft = createIcon("ChevronLeft");
export const ChevronRight = createIcon("ChevronRight");
export const Clock = createIcon("Clock");
export const Clock3 = createIcon("Clock3");
export const Compass = createIcon("Compass");
export const Copy = createIcon("Copy");
export const CreditCard = createIcon("CreditCard");
export const DollarSign = createIcon("DollarSign");
export const Download = createIcon("Download");
export const Edit = createIcon("Edit");
export const ExternalLink = createIcon("ExternalLink");
export const Eye = createIcon("Eye");
export const EyeOff = createIcon("EyeOff");
export const FileClock = createIcon("FileClock");
export const FileText = createIcon("FileText");
export const Filter = createIcon("Filter");
export const Hash = createIcon("Hash");
export const Heart = createIcon("Heart");
export const History = createIcon("History");
export const KeyRound = createIcon("KeyRound");
export const Layers = createIcon("Layers");
export const LayoutDashboard = createIcon("LayoutDashboard");
export const LineChart = createIcon("LineChart");
export const Loader = createIcon("Loader");
export const Loader2 = createIcon("Loader2");
export const Lock = createIcon("Lock");
export const LogIn = createIcon("LogIn");
export const LogOut = createIcon("LogOut");
export const Mail = createIcon("Mail");
export const MapPin = createIcon("MapPin");
export const MessageSquare = createIcon("MessageSquare");
export const Pause = createIcon("Pause");
export const Pencil = createIcon("Pencil");
export const Percent = createIcon("Percent");
export const Phone = createIcon("Phone");
export const PhoneCall = createIcon("PhoneCall");
export const Play = createIcon("Play");
export const Plus = createIcon("Plus");
export const QrCode = createIcon("QrCode");
export const Quote = createIcon("Quote");
export const RefreshCcw = createIcon("RefreshCcw");
export const RefreshCw = createIcon("RefreshCw");
export const Save = createIcon("Save");
export const ScanLine = createIcon("ScanLine");
export const Search = createIcon("Search");
export const Send = createIcon("Send");
export const Settings = createIcon("Settings");
export const Share2 = createIcon("Share2");
export const ShieldCheck = createIcon("ShieldCheck");
export const ShoppingCart = createIcon("ShoppingCart");
export const SlidersHorizontal = createIcon("SlidersHorizontal");
export const Sparkles = createIcon("Sparkles");
export const Star = createIcon("Star");
export const Store = createIcon("Store");
export const TicketPercent = createIcon("TicketPercent");
export const Timer = createIcon("Timer");
export const TimerReset = createIcon("TimerReset");
export const Trash2 = createIcon("Trash2");
export const TrendingDown = createIcon("TrendingDown");
export const TrendingUp = createIcon("TrendingUp");
export const Trophy = createIcon("Trophy");
export const UploadCloud = createIcon("UploadCloud");
export const User = createIcon("User");
export const UserPlus = createIcon("UserPlus");
export const Users = createIcon("Users");
export const Wallet = createIcon("Wallet");
export const Wallet2 = createIcon("Wallet2");
export const Wrench = createIcon("Wrench");
export const X = createIcon("X");
export const XCircle = createIcon("XCircle");
export const Zap = createIcon("Zap");
