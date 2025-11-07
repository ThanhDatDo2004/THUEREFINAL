import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const ICON_MAP: Record<string, React.ReactNode> = {
  ArrowRight: (
    <>
      <line key="l1" x1="5" y1="12" x2="19" y2="12" />
      <polyline key="p1" points="12 5 19 12 12 19" />
    </>
  ),
  AlertCircle: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <line key="l1" x1="12" y1="8" x2="12" y2="12" />
      <circle key="c2" cx="12" cy="16" r="0.5" fill="currentColor" stroke="none" />
    </>
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
  User: (
    <>
      <path key="p1" d="M17 21v-2a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v2" />
      <circle key="c1" cx="12" cy="7" r="4" />
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
  Mail: (
    <>
      <rect key="r1" x="3" y="6" width="18" height="12" rx="2" />
      <polyline key="p1" points="3 8.5 12 14 21 8.5" />
    </>
  ),
  Phone: (
    <path
      key="p1"
      d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 4h8"
    />
  ),
  Clock3: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <path key="p1" d="M12 6v6l3 2" />
    </>
  ),
  Sparkles: (
    <>
      <path key="p1" d="M5 3l1.5 4.5L11 9 6.5 10.5 5 15l-1.5-4.5L0 9l3.5-1.5z" />
      <path key="p2" d="M19 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
      <path key="p3" d="M14 13l.75 2.25L17 16l-2.25.75L14 19l-.75-2.25L11 16l2.25-.75z" />
    </>
  ),
  TrendingUp: (
    <>
      <polyline key="p1" points="3 17 9 11 13 15 21 7" />
      <polyline key="p2" points="14 7 21 7 21 14" />
    </>
  ),
  Building: (
    <>
      <rect key="r1" x="4" y="2" width="16" height="20" rx="2" />
      <path key="p1" d="M9 6h2v2H9zM13 6h2v2h-2zM9 10h2v2H9zM13 10h2v2h-2zM9 14h2v2H9zM13 14h2v2h-2z" />
      <path key="p2" d="M4 18h16" />
    </>
  ),
  Send: (
    <path key="p1" d="M4 4l16 8-16 8 4-8z" />
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
  LogOut: (
    <>
      <path key="p1" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline key="p2" points="16 17 21 12 16 7" />
      <line key="l1" x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  PhoneCall: (
    <>
      <path key="p1" d="M22 16.92V21a1 1 0 0 1-1.1 1 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3 2.1 1 1 0 0 1 4 1h4.09a1 1 0 0 1 1 .75l1.2 4.8a1 1 0 0 1-.29.95l-2.2 2.2a16 16 0 0 0 6 6l2.2-2.2a1 1 0 0 1 .95-.29l4.8 1.2a1 1 0 0 1 .75 1z" />
      <path key="p2" d="M15 5a5 5 0 0 1 5 5" />
      <path key="p3" d="M15 1a9 9 0 0 1 9 9" />
    </>
  ),
  ArrowLeft: (
    <>
      <line key="l1" x1="19" y1="12" x2="5" y2="12" />
      <polyline key="p1" points="12 5 5 12 12 19" />
    </>
  ),
  Star: (
    <path
      key="p1"
      d="M12 2.5l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.1l6.2-.9z"
    />
  ),
  Quote: (
    <>
      <path key="p1" d="M7 17a4 4 0 0 1-4-4V7h4z" />
      <path key="p2" d="M21 17a4 4 0 0 1-4-4V7h4z" />
    </>
  ),
  Compass: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <polygon key="p1" points="16 8 11 11 8 16 13 13" />
      <circle key="c2" cx="12" cy="12" r="1" />
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
  Trophy: (
    <>
      <path key="p1" d="M8 21h8" />
      <path key="p2" d="M12 17v4" />
      <path key="p3" d="M7 4h10l1 6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" />
      <path key="p4" d="M5 4v2a4 4 0 0 0 4 4" />
      <path key="p5" d="M19 4v2a4 4 0 0 1-4 4" />
    </>
  ),
  Zap: (
    <polyline key="p1" points="13 2 3 14 11 14 11 22 21 10 13 10 13 2" />
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
  MessageSquare: (
    <>
      <rect key="r1" x="3" y="5" width="18" height="14" rx="2" />
      <path key="p1" d="M7 19v4l4-4" />
    </>
  ),
  AlertTriangle: (
    <>
      <path key="p1" d="M10.3 3.5 1.4 19a1 1 0 0 0 .9 1.5h19.4a1 1 0 0 0 .9-1.5L13.4 3.5a1 1 0 0 0-1.8 0z" />
      <line key="l1" x1="12" y1="9" x2="12" y2="13" />
      <circle key="c1" cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  MapPin: (
    <>
      <path key="p1" d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
      <circle key="c1" cx="12" cy="11" r="2.5" />
    </>
  ),
  Clock: (
    <>
      <circle key="c1" cx="12" cy="12" r="10" />
      <path key="p1" d="M12 6v6l4 2" />
    </>
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
