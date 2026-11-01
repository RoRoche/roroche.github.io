export const site = {
  name: 'Romain Rochegude',
  role: 'Software architect & technical leader',
  description:
    'Software architecture, quality, automation and technical leadership. Articles, open-source tools and ideas by Romain Rochegude.',
  github: 'https://github.com/RoRoche',
  linkedin: 'https://www.linkedin.com/in/romain-rochegude-4750503b',
};
export const categories = [
  'architecture',
  'testing',
  'devops',
  'leadership',
] as const;
export const labels: Record<string, string> = {
  architecture: 'Architecture',
  testing: 'Testing',
  devops: 'DevOps',
  leadership: 'Leadership',
};
export const expertise = [
  {
    number: '01',
    title: 'Architecture with intent.',
    text: 'Clear boundaries, cohesive objects and decisions that stand the test of change.',
    tags: 'Java / DDD / Hexagonal architecture',
  },
  {
    number: '02',
    title: 'Quality by design.',
    text: 'Make confidence part of the code, with meaningful tests and executable architecture rules.',
    tags: 'TDD / Mutation testing / ArchUnit',
  },
  {
    number: '03',
    title: 'Automate the friction.',
    text: 'Build delivery systems that remove repetitive work and give engineers room to think.',
    tags: 'CI/CD / DevSecOps / Developer experience',
  },
  {
    number: '04',
    title: 'Grow the people.',
    text: 'Share context, coach with care and help teams take ownership of their engineering practices.',
    tags: 'Technical leadership / Mentoring / Teaching',
  },
];
