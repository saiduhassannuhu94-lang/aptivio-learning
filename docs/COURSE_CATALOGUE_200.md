# APTIVIO 200-Course Catalogue Programme

**Status:** Approved product target; catalogue blueprint only. No course records are created or published by this document.  
**Target:** 200 substantive courses across 20 learning domains.  
**Initial learner pricing:** Free during the pilot, as directed by the product owner.  
**Source of truth:** Course records and versioned learning content in Supabase, not this document.

## Why this programme exists

The live Supabase catalogue currently contains **2 published courses, 2 version-1 course records, 6 sections and 12 lessons**. Both courses are free. Both currently have null academic-review metadata. The catalogue therefore has a 198-course gap against the 200-course target, and the existing two courses must not be represented as academically reviewed.

This programme separates three things that are often carelessly mixed together:

1. **Platform capability:** the application, authoring workflow, access control, progress tracking and review process.
2. **Curriculum inventory:** the 200-course scope listed below.
3. **Published teaching material:** complete, quality-checked course versions that pass the content and academic gates.

A title in the inventory is a planned course, not a course available to learners.

## Catalogue production rules

Every course must have, at minimum:

- A distinct purpose, learner audience, entry level and practical value.
- A concise description, measurable learning outcomes and explicit prerequisites (or an explicit statement that none are required).
- At least **4 sections and 16 substantive lessons**. A lesson must teach something, not merely repeat a heading.
- Worked examples, practice tasks or labs, and a meaningful final project or applied exercise.
- At least one course assessment with an answer/rubric and a clear pass standard where assessment is appropriate.
- Estimated duration, language, accessibility notes and any required software/equipment.
- References or source notes for factual/technical material, plus a review date and reviewer identity after an actual review.
- A versioned content record. Published content is not silently overwritten; revisions create a new version.

**Quality gate:** no course is published merely because its title, description or lesson headings exist. Publication requires complete content, automated structural validation, an authorised academic review decision and a passing access/security check.

**No fabricated metadata:** never invent reviewer names, approval dates, credentials, lesson completion, learner enrolments or course counts. Review metadata is written only after a real authorised review.

## Production batches

| Batch | Scope | Completion gate |
|---|---|---|
| 0 | Catalogue schema, authoring/import validation, review workflow, and course-version publishing rules | Tests prove invalid/incomplete content cannot be published |
| 1 | Courses 1–20 | Complete content + technical review + pilot learner testing |
| 2 | Courses 21–40 | Same gate; fix batch-1 feedback before scaling |
| 3 | Courses 41–60 | Same gate |
| 4 | Courses 61–80 | Same gate |
| 5 | Courses 81–100 | Midpoint quality and coverage audit |
| 6 | Courses 101–120 | Same gate |
| 7 | Courses 121–140 | Same gate |
| 8 | Courses 141–160 | Same gate |
| 9 | Courses 161–180 | Same gate |
| 10 | Courses 181–200 | Final catalogue audit and release approval |

A batch is not counted as delivered until its courses are complete and published through the real review workflow. Drafts and planned titles are reported separately.

## Planned catalogue: 20 domains × 10 courses


### 1. Programming & Software Foundations

1. Programming Logic and Problem Solving
2. Python Programming: Beginner to Intermediate
3. JavaScript Programming: Core Concepts
4. Java Programming and Object-Oriented Design
5. C Programming and Memory Fundamentals
6. C++ Programming and Data Structures
7. C# and .NET Application Development
8. PHP Programming for Web Backends
9. Go Programming for Networked Services
10. Software Testing and Quality Assurance

### 2. Web Development

11. HTML5: Semantic Structure and Accessibility
12. CSS3: Layout, Responsive Design and Motion
13. Modern JavaScript for Browser Applications
14. TypeScript for Reliable Frontend Code
15. React: Components, State and Effects
16. Next.js App Router and Full-Stack Patterns
17. Node.js and Express API Development
18. REST API Design and Documentation
19. Web Performance and Core Web Vitals
20. Progressive Web Apps and Offline-First Design

### 3. Mobile Development

21. Android Development with Kotlin
22. Android Development with Java
23. Flutter and Dart Foundations
24. React Native Cross-Platform Development
25. Mobile UI Design and Accessibility
26. Mobile App Architecture and State Management
27. Offline Data and Synchronisation on Mobile
28. Mobile App Testing and Release Engineering
29. Mobile Security and Privacy
30. Publishing and Maintaining Mobile Applications

### 4. Data Structures & Algorithms

31. Data Structures: Arrays, Lists and Hash Tables
32. Stacks, Queues, Trees and Graphs
33. Algorithm Analysis and Big-O Reasoning
34. Sorting and Searching Algorithms
35. Recursion and Backtracking
36. Greedy Algorithms and Dynamic Programming
37. Graph Algorithms and Network Problems
38. Competitive Programming Foundations
39. Algorithm Design for Real Applications
40. Technical Interview Problem Solving

### 5. Databases & Data Engineering

41. Relational Database Design and Normalisation
42. SQL Fundamentals and Query Design
43. Advanced SQL: Joins, Windows and CTEs
44. PostgreSQL Administration and Performance
45. Database Transactions and Concurrency
46. NoSQL Data Modelling with MongoDB
47. Data Warehousing and Dimensional Modelling
48. ETL Pipelines and Data Quality
49. Data Engineering with Python
50. Database Security, Backup and Recovery

### 6. Artificial Intelligence & Machine Learning

51. AI Concepts and Responsible AI Foundations
52. Machine Learning with Python
53. Supervised Learning and Model Evaluation
54. Unsupervised Learning and Clustering
55. Deep Learning with Neural Networks
56. Natural Language Processing Foundations
57. Computer Vision with Python
58. Generative AI and Large Language Models
59. Prompt Engineering and AI Application Design
60. AI Evaluation, Safety and Deployment

### 7. Cybersecurity

61. Cybersecurity Principles and Threat Modelling
62. Networking for Security Practitioners
63. Linux Security and System Hardening
64. Web Application Security Fundamentals
65. Ethical Hacking: Legal Lab Practice
66. Digital Forensics and Incident Response
67. Identity, Authentication and Access Control
68. Cryptography Concepts and Secure Protocols
69. Cloud Security Fundamentals
70. Security Operations and Vulnerability Management

### 8. Networking & Systems

71. Computer Networking: TCP/IP Foundations
72. Routing, Switching and Network Troubleshooting
73. Linux Command Line and Administration
74. Windows Administration Fundamentals
75. Operating Systems Concepts
76. Computer Architecture and Digital Logic
77. Virtualisation and Container Fundamentals
78. DNS, DHCP and Network Services
79. Network Monitoring and Reliability
80. Systems Administration Automation with Python

### 9. Cloud & DevOps

81. Cloud Computing Concepts and Architecture
82. AWS Cloud Foundations
83. Microsoft Azure Fundamentals
84. Google Cloud Platform Foundations
85. Docker and Container Workflows
86. Kubernetes Foundations
87. CI/CD with GitHub Actions
88. Infrastructure as Code with Terraform
89. Site Reliability Engineering Foundations
90. Cloud Cost, Observability and Operations

### 10. Software Engineering & Architecture

91. Software Development Life Cycle and Agile Practice
92. Requirements Engineering and User Stories
93. UML and Software Modelling
94. Object-Oriented Design Principles
95. Clean Code and Refactoring
96. Design Patterns in Practice
97. System Design Fundamentals
98. Microservices and Distributed Systems
99. Secure Software Development Lifecycle
100. Software Project Estimation and Delivery

### 11. UI/UX & Product Design

101. Human-Computer Interaction Foundations
102. UX Research and User Interviews
103. Information Architecture and User Flows
104. Wireframing and Prototyping with Figma
105. Visual Design and Design Systems
106. Interaction Design and Microinteractions
107. Accessibility and Inclusive Design
108. Usability Testing and Product Analytics
109. Mobile UX Design
110. Product Design Portfolio Project

### 12. Mathematics & Statistics for Computing

111. Discrete Mathematics for Computing
112. Logic, Sets and Proof Techniques
113. Linear Algebra for AI and Graphics
114. Calculus for Computing Applications
115. Probability for Data Science
116. Statistics and Hypothesis Testing
117. Numerical Methods and Error Analysis
118. Combinatorics and Graph Theory
119. Optimisation Methods for Machine Learning
120. Mathematical Modelling with Python

### 13. Computer Science Core

121. Introduction to Computer Science
122. Computer Organisation and Assembly Basics
123. Theory of Computation Foundations
124. Compiler Design and Language Processing
125. Programming Language Concepts
126. Concurrency and Parallel Computing
127. Distributed Computing Principles
128. Information Theory and Data Representation
129. Formal Methods and Program Verification
130. Research Methods in Computing

### 14. IT Support & Digital Literacy

131. Computer Literacy and Digital Productivity
132. Computer Hardware Assembly and Maintenance
133. Operating Computer Systems
134. IT Help Desk and Technical Support
135. Troubleshooting Networks and Devices
136. Microsoft 365 for Work and Study
137. Google Workspace for Collaboration
138. Digital Safety and Personal Data Protection
139. IT Asset and Service Management
140. Technical Documentation and User Support

### 15. Business, Entrepreneurship & Management

141. Entrepreneurship and Opportunity Discovery
142. Business Model Design and Validation
143. Business Communication and Professional Writing
144. Project Management Fundamentals
145. Operations and Process Improvement
146. Small Business Finance and Bookkeeping
147. Digital Marketing Strategy
148. Customer Discovery and Market Research
149. Product Management Foundations
150. Business Analytics for Decision Making

### 16. Digital Media & Creative Technology

151. Graphic Design Principles and Visual Communication
152. Canva for Professional Design Workflows
153. Video Editing with CapCut
154. Professional Video Production Fundamentals
155. Motion Graphics and Visual Effects Basics
156. Audio Editing and Podcast Production
157. Photography and Digital Image Editing
158. Content Strategy for Social Platforms
159. Animation Principles for Digital Creators
160. Creative Portfolio and Client Workflow

### 17. Information Systems & Analytics

161. Information Systems Fundamentals
162. Systems Analysis and Design
163. Business Process Modelling
164. Management Information Systems
165. Decision Support Systems
166. Data Visualisation with Power BI
167. Data Analysis with Excel
168. Python for Business Analytics
169. Information Governance and Data Ethics
170. Enterprise Systems and ERP Concepts

### 18. Education & Learning Technology

171. Instructional Design Fundamentals
172. Learning Management Systems Administration
173. Digital Course Authoring and Assessment
174. Online Teaching and Facilitation
175. Learning Analytics and Student Progress
176. Educational Technology Integration
177. Assessment Design and Rubrics
178. Accessible Digital Learning Materials
179. Blended Learning Programme Design
180. Building and Evaluating Online Learning Experiences

### 19. Embedded, IoT & Robotics

181. Digital Electronics for Computing
182. Microcontrollers with Arduino
183. Embedded C Programming
184. Raspberry Pi Projects and Linux
185. Internet of Things Foundations
186. IoT Sensors and Data Collection
187. IoT Networking and Protocols
188. Robotics Fundamentals and Control
189. Edge Computing and Embedded AI
190. IoT Security and Device Management

### 20. Career & Professional Practice

191. Technical Communication for Developers
192. Git and Collaborative Software Workflows
193. Building a Professional Developer Portfolio
194. Open Source Contribution Foundations
195. Freelancing for Technology Professionals
196. Technical Interview and Career Preparation
197. Professional Ethics and Responsible Computing
198. Working in Distributed Engineering Teams
199. Technical Leadership and Mentoring Foundations
200. Capstone Project: Plan, Build and Present a Product

## Release metrics

Track these independently:

- Planned course titles: 200.
- Courses with complete draft content.
- Courses submitted for academic review.
- Courses approved by an authorised reviewer.
- Courses published and visible in the live catalogue.
- Sections and substantive lessons published.
- Courses with assessments and applied projects.
- Courses blocked by quality, accessibility, security or source-review findings.

The headline **200 courses** is achieved only when 200 distinct course versions are actually published and pass the release gate. A database row count alone is not enough.

## Current baseline and immediate engineering sequence

1. Reconcile the Gate 1 PR documentation with the live catalogue state.
2. Finish and test the academic review workflow before approving any new course.
3. Build a validated course-authoring/import path that creates draft course versions, sections, lessons and assessments without bypassing RLS or review gates.
4. Create the first 20 complete course packages in a repeatable format; validate them before importing.
5. Publish only after real review decisions. Keep the pilot free and keep payment processing out of this catalogue milestone.
6. Repeat in batches of 20, reporting drafts, approved courses and published courses separately.

## Non-goals

- No bulk insertion of 200 empty course shells.
- No generated placeholder lessons presented as teaching.
- No fake reviewer identities or backdated approvals.
- No production schema/data mutation as part of this planning document.
- No paid checkout or Paystack activation during the free pilot.
