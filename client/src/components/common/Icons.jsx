// Small inline icon set (stroke icons, inherit currentColor)
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const mk = (paths) =>
  function Icon({ size = 20, ...rest }) {
    return (
      <svg {...base} width={size} height={size} {...rest}>
        {paths}
      </svg>
    );
  };

export const IconUser = mk(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const IconBrush = mk(<><path d="M9.06 11.9 18 3l3 3-8.94 8.94" /><path d="M7 14a3 3 0 0 0-3 3c0 1.5-1 2.5-2 3 4 1 7-1 7-4a3 3 0 0 0-2-2Z" /></>);
export const IconBox = mk(<><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></>);
export const IconStore = mk(<><path d="M3 9 4.5 4h15L21 9" /><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9Z" /><path d="M5 13v8h14v-8" /></>);
export const IconCart = mk(<><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6" /></>);
export const IconTruck = mk(<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>);
export const IconShield = mk(<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>);
export const IconChart = mk(<><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>);
export const IconSparkle = mk(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>);
export const IconArrow = mk(<path d="M5 12h14M13 6l6 6-6 6" />);
export const IconCheck = mk(<path d="m5 12 5 5 9-10" />);
export const IconSearch = mk(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconHeart = mk(<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z" />);
export const IconStar = mk(<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z" />);
export const IconCard = mk(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>);
export const IconLock = mk(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
export const IconUpload = mk(<><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 20h16" /></>);
export const IconEye = mk(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const IconGlobe = mk(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
export const IconMenu = mk(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconX = mk(<path d="M6 6l12 12M18 6 6 18" />);
export const IconAdmin = mk(<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><circle cx="12" cy="11" r="2.5" /><path d="M8 16a4 4 0 0 1 8 0" /></>);
export const IconLogout = mk(<><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 17l-5-5 5-5M5 12h11" /></>);
export const IconInstagram = mk(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></>);
export const IconFacebook = mk(<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5Z" />);
export const IconTwitter = mk(<path d="M4 4l16 16M20 4 4 20" />);
export const IconYoutube = mk(<><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" /></>);
export const IconWhatsapp = mk(<><path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 7.8 19.6L3 21Z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 9.5Z" /></>);
export const IconMail = mk(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>);
export const IconChevronLeft = mk(<path d="m15 6-6 6 6 6" />);
export const IconChevronRight = mk(<path d="m9 6 6 6-6 6" />);
export const IconChevronUp = mk(<path d="m6 15 6-6 6 6" />);
export const IconChevronDown = mk(<path d="m6 9 6 6 6-6" />);
export const IconMonitor = mk(<><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>);
export const IconPhone = mk(<><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></>);
export const IconTablet = mk(<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M11 18h2" /></>);
export const IconLayers = mk(<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /><path d="m3 17.5 9 5 9-5" opacity=".5" /></>);
export const IconCube = mk(<><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" /><path d="m3 7 9 5 9-5M12 12v10" /></>);
export const IconRotate = mk(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>);
export const IconPalette = mk(<><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.1 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4c0-4.7-4-8.7-9-8.7Z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" /><circle cx="10" cy="7" r="1" fill="currentColor" /><circle cx="15" cy="7.5" r="1" fill="currentColor" /></>);
export const IconType = mk(<path d="M4 7V5h16v2M9 19h6M12 5v14" />);
export const IconLayout = mk(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></>);
export const IconSettings = mk(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>);
export const IconTag = mk(<><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.5" /></>);
export const IconShuffle = mk(<><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></>);
export const IconExpand = mk(<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />);
