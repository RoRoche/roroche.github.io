export const projects = [
  {
    name: 'eoconfig',
    category: 'Configuration',
    summary: 'Configuration that composes.',
    problem:
      'Configuration reads can spread parsing, defaults and source selection across an application.',
    approach:
      'Small, immutable Java objects provide type-safe access and compose configuration sources through a common interface.',
    tech: ['Java', 'Composition', 'Immutability'],
    artifact: 'eoconfig',
  },
  {
    name: 'eorules',
    category: 'Architecture as code',
    summary: 'Make design principles executable.',
    problem:
      'Object-oriented design conventions are easy to agree on and hard to enforce consistently in reviews.',
    approach:
      'Custom ArchUnit rules turn Elegant Objects principles into automated checks that run alongside the test suite.',
    tech: ['Java', 'ArchUnit', 'Elegant Objects'],
    artifact: 'eorules',
  },
  {
    name: 'kstreamsmatchers',
    category: 'Testing',
    summary: 'Readable tests for stream processing.',
    problem:
      'Kafka Streams assertions can hide the behavior under test behind repetitive verification code.',
    approach:
      'Custom Hamcrest matchers express expectations for Kafka Streams applications with composable assertions.',
    tech: ['Java', 'Kafka Streams', 'Hamcrest'],
    artifact: 'kstreamsmatchers',
  },
  {
    name: 'class-diagram-maven-plugin',
    category: 'Documentation',
    summary: 'Let the code draw the diagram.',
    problem:
      'Hand-maintained class diagrams drift away from the implementation as a codebase evolves.',
    approach:
      'ClassGraph analyzes compiled Java classes and generates configurable PlantUML diagrams within the Maven lifecycle.',
    tech: ['Java', 'Maven', 'ClassGraph', 'PlantUML'],
    artifact: 'class-diagram-maven-plugin',
  },
];
