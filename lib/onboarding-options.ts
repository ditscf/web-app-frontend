export const studyClasses = ["Master's Degree", "Bachelor's Degree", 'Ordinary Diploma'] as const;

export type StudyClass = (typeof studyClasses)[number];

export const coursesByStudyClass: Record<StudyClass, readonly string[]> = {
  'Ordinary Diploma': [
    'Civil Engineering',
    'Computer Engineering',
    'Electrical Engineering',
    'Renewable Energy Technology',
    'Biomedical Equipment Engineering',
    'Electronics and Telecommunications Engineering',
    'Mechanical Engineering',
    'Science and Laboratory Technology',
    'Mining Engineering',
    'Information Technology',
    'Communication System Technology',
    'Multimedia and Film Technology',
    'Food Science and Technology',
    'Biotechnology',
    'Leather Processing Technologies',
    'Industrial Automation Engineering',
    'Electrical and Renewable Energy Engineering',
  ],
  "Bachelor's Degree": [
    'Civil Engineering',
    'Computer Engineering',
    'Electrical Engineering',
    'Electronics and Telecommunications Engineering',
    'Mechanical Engineering',
    'Laboratory Sciences',
    'Oil and Gas Engineering',
    'Mining Engineering',
    'Bio Medical Engineering Equipment',
  ],
  "Master's Degree": [
    'Maintenance Management',
    'Computing and Communications',
    'Sustainable Energy Engineering',
    'Computational Science and Engineering',
    'Cyber Security and Digital Forensic',
    'Information Systems Engineering and Management',
    'Telecommunication Systems and Networks',
  ],
};

export const yearsOfStudy = [
  '2020/2021',
  '2021/2022',
  '2022/2023',
  '2023/2024',
  '2024/2025',
  '2025/2026',
  '2026/2027',
] as const;

export const ministryOptions = [
  'Praise Team',
  'Media Team',
  'Dancers',
  'Evangelists',
  'Teachers of the Word',
  'Instrumentalists',
] as const;

export function isStudyClass(value: string): value is StudyClass {
  return (studyClasses as readonly string[]).includes(value);
}

export function getCoursesForStudyClass(studyClass: string): readonly string[] {
  return isStudyClass(studyClass) ? coursesByStudyClass[studyClass] : [];
}
