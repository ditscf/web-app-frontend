import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpenText,
  CalendarDays,
  ClipboardCheck,
  HeartHandshake,
  Megaphone,
  Music2,
  Network,
  Send,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import type { ComponentType } from 'react';
import {
  DribbbleIcon,
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from '@/components/landing/social-icons';
import type { StaticImageData } from 'next/image';
import praiseWorshipImage from '@/public/09.jpg';
import mediaTeamImage from '@/public/01.jpg';
import dancersMinistryImage from '@/public/02.jpg';
import evangelism from '@/public/evangelism.jpg';
import teacher from '@/public/preacher2.jpg';
import instrumentalists from '@/public/instrumentalists.jpeg';
import chairperson from '@/public/Chairperson.jpg';
import viceChairperson from '@/public/ViceChairperson.jpg';
import secretary from '@/public/secretary.jpg';
import viceSecretary from '@/public/viceSecretary.jpg';
import treasurer from '@/public/Treasurer.jpg';
import mjombaImage from '@/public/togthr.jpg';
import ditscfLogo from '@/public/ditscf.png';
import togetherPost from '@/public/togetherInPraise.jpeg';
import pic01 from '@/public/06.jpeg';
import pic02 from '@/public/07.jpeg';
import pic04 from '@/public/09.jpg';
import pic07 from '@/public/12.jpeg';
import pic08 from '@/public/13.jpeg';
import pic09 from '@/public/14.jpeg';

export type Stat = {
  label: string;
  value: number;
};

export type ValueItem = {
  title: string;
  text: string;
};

export type Ministry = {
  title: string;
  image: StaticImageData;
  description: string;
  activities: string[];
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export type PlatformFeature = {
  label: string;
  icon: LucideIcon;
};

export type Leader = {
  role: string;
  name: string;
  text: string;
  image: StaticImageData;
};

export type GalleryItem = {
  label: string;
  image: StaticImageData;
};

export type Pillar = {
  label: string;
  icon: LucideIcon;
};

export type SocialLink = {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

export type ContactField = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'tel';
  autoComplete: string;
};

export const ditscfLogoImage = ditscfLogo;

export const navItems = ['About', 'Ministries', 'Events', 'Platform', 'Contact'] as const;

export const heroImages = [pic01, pic02, mediaTeamImage];

export const aboutImage = pic04;

export const heroStats: Stat[] = [
  { label: 'Students Reached', value: 2500 },
  { label: 'Leaders Developed', value: 180 },
  { label: 'Outreach Missions', value: 64 },
  { label: 'Prayer Sessions', value: 420 },
];

export const values: ValueItem[] = [
  {
    title: 'Mission',
    text: 'To raise Christ-centered students who grow in faith, serve with excellence, and influence campus life with the gospel.',
  },
  {
    title: 'Vision',
    text: 'A transformed DIT community where students encounter Christ, discover purpose, and become servant leaders.',
  },
  {
    title: 'Faith',
    text: 'We build every ministry on the word of God, prayer, and obedience to Christ.',
  },
  {
    title: 'Love',
    text: 'We create a home where every student is known, cared for, and encouraged.',
  },
  {
    title: 'Integrity',
    text: 'We lead transparently and steward people, time, and resources with honor.',
  },
  {
    title: 'Excellence',
    text: 'We serve God and people with preparation, creativity, and discipline.',
  },
  {
    title: 'Service',
    text: 'We turn worship into action through outreach, care, and community impact.',
  },
  {
    title: 'Unity',
    text: 'We celebrate diverse gifts and departments as one body in Christ.',
  },
  {
    title: 'Leadership',
    text: 'We develop leaders who influence the campus and the world beyond graduation.',
  },
];

export const ministries: Ministry[] = [
  {
    title: 'Praise & Worship Team',
    image: praiseWorshipImage,
    description: 'Leading the fellowship into heartfelt worship with spiritual depth and musical excellence.',
    activities: ['Sunday worship', 'Vocal training', 'Worship nights'],
  },
  {
    title: 'Media Team',
    image: mediaTeamImage,
    description: 'Telling the DITSCF story through photography, livestreams, design, and digital communication.',
    activities: ['Photography', 'Livestream', 'Design'],
  },
  {
    title: 'Dancers Ministry',
    image: dancersMinistryImage,
    description: 'Expressing worship, testimony, and gospel joy through disciplined creative movement.',
    activities: ['Choreography', 'Event ministration', 'Training'],
  },
  {
    title: 'Evangelism & Missions',
    image: evangelism,
    description: 'Reaching students and communities with compassion, prayer, discipleship, and service.',
    activities: ['Campus missions', 'Community outreach', 'Follow-up'],
  },
  {
    title: 'Teachers of the Word',
    image: teacher,
    description: 'Equipping believers through biblical teaching, discipleship classes, and study groups.',
    activities: ['Bible study', 'Discipleship', 'Apologetics'],
  },
  {
    title: 'Instrumentalists',
    image: instrumentalists,
    description: 'Serving the sound of worship with skill, humility, rehearsal culture, and unity.',
    activities: ['Band practice', 'Mentorship', 'Live sessions'],
  },
];

export const events = [
  'Together in Praise & Worship',
  'Gospel Outreach Missions',
  'Prayer Camps',
  'Overnight Prayer Meetings',
  'Leadership Conferences',
  'Bible Study Conferences',
  'Community Service Activities',
];

export const featuredEvent = {
  title: 'Together in Praise & Worship',
  image: togetherPost,
  description:
    'A campus-wide worship experience gathering students for praise, prayer, testimony, and surrender to Christ.',
  schedule: '3rd July, 2026 0800 - till dawn',
};

export const testimonials: Testimonial[] = [
  {
    quote:
      'DITSCF gave me more than friends. It shaped my devotion, discipline, leadership, and courage to live for Christ on campus.',
    name: 'Grace Emmanuel',
    role: 'Alumni, Computer Engineering',
  },
  {
    quote:
      'Through the fellowship I found a spiritual family that prayed with me, taught me the Word, and helped me discover purpose.',
    name: 'Joshua Mrema',
    role: 'Member, Electrical Engineering',
  },
  {
    quote:
      'The leadership culture here is serious, humble, and excellent. DITSCF prepared me to serve beyond university life.',
    name: 'Neema Joseph',
    role: 'Former Ministry Coordinator',
  },
];

export const platformFeatures: PlatformFeature[] = [
  { label: 'Membership Management', icon: UsersRound },
  { label: 'Event Management', icon: CalendarDays },
  { label: 'Attendance Tracking', icon: ClipboardCheck },
  { label: 'Ministry Coordination', icon: Network },
  { label: 'Communication', icon: Megaphone },
  { label: 'Analytics & Reporting', icon: BarChart3 },
];

export const attendanceBars = [38, 58, 46, 72, 88, 64, 96];

export const leaders: Leader[] = [
  {
    role: 'Chairman',
    name: 'Adriano Chalema',
    text: 'Spiritual direction, unity, and vision alignment',
    image: chairperson,
  },
  {
    role: 'Vice Chairman',
    name: 'Emmanuel Magubu',
    text: 'Ministry operations and team coordination',
    image: viceChairperson,
  },
  {
    role: 'General Secretary',
    name: 'Godbless Kalist',
    text: 'Records, communication, and governance',
    image: secretary,
  },
  {
    role: 'Vice General Secretary',
    name: 'Mary Sonelo',
    text: 'Member follow-up and documentation',
    image: viceSecretary,
  },
  {
    role: 'Treasurer',
    name: 'Naomi K.',
    text: 'Finance stewardship and accountability',
    image: treasurer,
  },
];

export const gallery: GalleryItem[] = [
  { label: 'Worship', image: praiseWorshipImage },
  { label: 'Prayer', image: pic01 },
  { label: 'Outreach', image: mjombaImage },
  { label: 'Conferences', image: pic07 },
  { label: 'Fellowship', image: pic08 },
  { label: 'Leadership', image: pic09 },
];

export const impactStats: Stat[] = [
  { label: 'Students Reached', value: 2500 },
  { label: 'Leaders Developed', value: 180 },
  { label: 'Outreach Missions', value: 64 },
  { label: 'Prayer Sessions', value: 420 },
  { label: 'Events Hosted', value: 210 },
  { label: 'Graduates Impacted', value: 900 },
];

export const pillars: Pillar[] = [
  { label: 'Spiritual Growth', icon: BookOpenText },
  { label: 'Discipleship', icon: UsersRound },
  { label: 'Worship', icon: Music2 },
  { label: 'Evangelism', icon: Send },
  { label: 'Leadership', icon: ShieldCheck },
  { label: 'Community Impact', icon: HeartHandshake },
];

export const socialLinks: SocialLink[] = [
  { label: 'Facebook', icon: FacebookIcon },
  { label: 'Instagram', icon: InstagramIcon },
  { label: 'YouTube', icon: YoutubeIcon },
  { label: 'Dribbble', icon: DribbbleIcon },
];

export const contactFields: ContactField[] = [
  { id: 'full-name', label: 'Full name', autoComplete: 'name' },
  { id: 'email', label: 'Email address', type: 'email', autoComplete: 'email' },
  { id: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel' },
  { id: 'department', label: 'Department / Course', autoComplete: 'organization' },
];
