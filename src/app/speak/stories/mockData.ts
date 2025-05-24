import { Story } from "./page";

// Mock stories for practice
export const STORIES: Story[] = [
  {
    id: "story-1",
    title: "The Determined Developer",
    content: `Once upon a time in a bustling tech hub, there lived a young developer named Maya. Every morning, she arrived at her tiny corner desk with a steaming cup of coffee and a heart full of ideas. Her dream was to create an app that would help people learn new languages through short, daily stories—just like the one you're reading now.

  One afternoon, after weeks of coding, Maya finally released the first version of her app. Excited users flooded in, but not long after, bug reports began to pour in. Some stories failed to load, buttons didn't respond, and worst of all, the progress tracker reset itself at random. Maya felt her excitement fade into frustration.

  Instead of giving up, she took a deep breath and wrote down each bug report. She prioritized them: "Failed loads" at the top, "unresponsive buttons" next, and "tracker resets" after that. Day by day, she tackled one issue at a time. She added logging to find where the app crashed, rewrote the button-handling code to be more robust, and fixed the logic in the tracker so it stored progress reliably.

  A week later, Maya rolled out an update—and this time, everything worked flawlessly. Users praised the smooth experience and shared stories of how they were finally keeping up with their language goals. Maya watched the download numbers climb and felt a surge of pride. She realized that perseverance, careful planning, and steady effort could turn frustration into success.

  And so, Maya's app became a favorite among language learners everywhere, all because she refused to let setbacks stop her. The end.`,
    difficulty: "intermediate",
    words: 255,
  },
  {
    id: "story-2",
    title: "The First Day",
    content: `It was Sarah's first day at her new job. She woke up early and prepared a healthy breakfast. She was excited but also nervous. The office was in a tall building downtown. 

She arrived fifteen minutes early and took the elevator to the tenth floor. Her new boss greeted her with a warm smile and showed her to her desk. Everyone was friendly and helpful. 

By lunchtime, Sarah had already learned many new things. She felt happy about her decision to take this job. At the end of the day, she was tired but satisfied. She knew tomorrow would be even better.`,
    difficulty: "beginner",
    words: 98,
  },
  {
    id: "story-3",
    title: "The Quantum Paradox",
    content: `Professor Elena Nakamura scrutinized the quantum readings fluctuating across her holographic display. The entanglement pattern exhibited unprecedented stability despite the gravitational interference from the nearby neutron star. Her groundbreaking experiment—combining quantum teleportation with relativistic frame-dragging—was yielding results that contradicted three established laws of physics simultaneously.

  "The paradox suggests a fundamental misunderstanding in our model of quantum gravity," she explained to her bewildered graduate students. "The non-locality principle isn't being violated; rather, it's operating within a higher-dimensional framework that our instruments are only now capable of detecting."

  Elena's colleagues at CERN and the Perimeter Institute had initially dismissed her theoretical framework as mathematically elegant but experimentally unfeasible. Now, as her quantum processor maintained coherence at temperatures approaching 80 Kelvin—far above the predicted thermal decoherence threshold—the scientific community would have to reconsider the very foundations of quantum mechanics.`,
    difficulty: "advanced",
    words: 143,
  },
  {
    id: "story-4",
    title: "A Lost Puppy",
    content: `One morning, Anna found a small puppy in her backyard. The puppy looked hungry and scared. Anna picked it up gently and gave it water. She looked for a collar but did not find one. She decided to take the puppy to the animal shelter. At the shelter, the staff smiled and thanked Anna. They promised to care for the puppy until its owner came. Anna felt happy that she helped a little dog. She waved goodbye to the puppy as it went into the shelter building.`,
    difficulty: "beginner",
    words: 87,
  },
  {
    id: "story-5",
    title: "Missing Homework",
    content: `Tom realized he forgot to do his homework on Friday night. He searched his room but could not find his notebook. He felt worried. On Saturday morning, he went to school and told his teacher the truth. The teacher listened and asked him to complete the work by Monday. Tom promised to finish it and thanked his teacher. He went home, opened his notebook, and spent two hours writing the assignment. On Monday, he gave the homework to the teacher with a smile. The teacher was happy. Tom learned to use reminders for his tasks.`,
    difficulty: "beginner",
    words: 95,
  },
  {
    id: "story-6",
    title: "The Garden Surprise",
    content: `Every Saturday, Lisa plants flowers in her garden. This week, she planted red roses, yellow tulips, and purple daisies. On Sunday morning, she saw a small bird building a nest in a bush. Lisa watched quietly and felt joyful. She did not disturb the bird. Each day, she watered the plants and whispered kind words to them. One afternoon, she found fresh baby chicks in the nest. She took a photo and shared it with her friends. They praised her garden. Lisa felt proud and smiled under the sunny sky.`,
    difficulty: "beginner",
    words: 90,
  },
  {
    id: "story-7",
    title: "The Mountain Hike",
    content: `It was early spring when Javier decided to lead his small team on a mountain hike. He organized gear checks, mapped the trail, and scheduled rest points. The group met at dawn, each carrying a backpack filled with water, snacks, and warm layers. Birds sang in the crisp air as they began the ascent. Two hours in, the path grew steeper and rocks littered the trail. One teammate slipped, twisting her ankle. Javier immediately halted the climb and assessed the injury. He wrapped her ankle with a spare bandage and adjusted the pace to support her recovery.

By midday, they reached a narrow ledge overlooking a valley of wildflowers. Javier encouraged everyone to rest and share their food. He noticed the injured teammate smiling despite her pain. The view reminded them why they had embarked on this journey: to challenge themselves and appreciate nature’s beauty. On the descent, they moved carefully, each person taking turns at the front to guide the group. When they returned to base camp at sunset, weary but exhilarated, they celebrated with hot cocoa. They each shared one lesson they learned along the way, making the hike unforgettable.`,
    difficulty: "intermediate",
    words: 209,
  },
  {
    id: "story-8",
    title: "The Code Review Challenge",
    content: `On her third week at BlueWave Tech, Priya faced her first major code review. She had spent hours writing a complex module for data synchronization between the mobile app and server. Confident in her work, she submitted her pull request late one evening. The next morning, she woke to dozens of comments—some suggesting optimizations, others pointing out potential race conditions. Priya felt overwhelmed but refused to ignore the feedback.

She scheduled a meeting with her mentor, Carlos, to go through each comment systematically. Together, they explained the reasoning behind the suggestions and demonstrated how to write clearer unit tests. Priya took detailed notes and committed to improving her code style. Over the next two days, she refactored the module: she replaced nested callbacks with async/await, added error handling, and increased test coverage by writing edge-case scenarios.

When she submitted the updated pull request, the reviewers praised her improvements and noted how clean the code looked. Priya learned that code review was not a personal judgment but a collaborative process to build better software. Her manager later used her revised module as an example in the team’s best practices guide.`,
    difficulty: "intermediate",
    words: 208,
  },
  {
    id: "story-9",
    title: "The Startup Pitch",
    content: `When Liwei decided to join a weekend hackathon, she formed a team of three: a designer, a developer, and a marketer. Their goal was to build a prototype of an eco-friendly delivery drone and pitch it to potential investors by Sunday afternoon. On Friday night, they brainstormed features, assigned tasks, and created a shared timeline. The designer sketched user interfaces, the developer wrote core drone-flight algorithms, and the marketer researched market trends and prepared a slide deck.

By Saturday morning, they encountered unexpected setbacks: the simulation crashed due to a missing library, and the slide deck lacked clarity. Liwei called an emergency stand-up meeting. The developer fixed the simulation by installing the correct dependencies and optimizing the code. The marketer reorganized the slides to highlight the user benefits first and trimmed unnecessary data points. Meanwhile, the designer refined the UI mockups to match the brand’s color palette.

On Sunday, they rehearsed their pitch in front of a mirror, timing each section meticulously. They anticipated tough questions about cost, safety, and scalability. When it was time to present, their prototypes flew smoothly across the conference hall, and their slides told a compelling story. The judges awarded them second place and praised their teamwork under pressure. Exhausted but proud, Liwei and her team celebrated, knowing they had turned a tight deadline into a learning experience they would never forget.`,
    difficulty: "intermediate",
    words: 227,
  },
  {
    id: "story-10",
    title: "The Unexpected Mentor",
    content: `When Alex joined the robotics club at university, he expected to learn mechanical design but not to teach anyone else. During the first meeting, the club president, Sophia, asked Alex to help a new student, Raj, with basic circuit assembly. Alex hesitated; he had only assembled his first circuit last month. Nevertheless, he agreed.

Over the next week, Alex prepared a short tutorial complete with diagrams and step-by-step instructions. Raj arrived for the session eager to learn but struggled to recognize resistor color codes. Alex patiently demonstrated the color bands and used analogy—comparing them to stripes on a flag—to help Raj remember each value. By the third session, Raj could wire a simple LED circuit without guidance.

As Alex guided Raj through increasingly complex projects, he realized how much he had learned himself. His confidence grew, and he volunteered to lead a weekend workshop for the entire club. Sophia praised his initiative and told him he had become a mentor. In that moment, Alex understood that teaching others was one of the best ways to solidify one’s own knowledge. The club went on to win the regional robotics competition, and Alex credited the experience of guiding Raj as a key factor in their success.`,
    difficulty: "intermediate",
    words: 204,
  },
  {
    id: "story-11",
    title: "The Midnight Fix",
    content: `Late one Friday night, DevOps engineer Mei received an urgent alert: the production website was down. She quickly logged into the monitoring dashboard and saw a surge of 500 errors. The latest code deployment had introduced a misconfigured environment variable. Mei informed the on-call developer and began rolling back the release. Despite the pressure, she followed the rollback checklist: disabling traffic, restoring the previous build, and running health checks.

Within ten minutes, traffic resumed normally. However, Mei knew this was only a temporary fix. She created a fork of the latest release, reproduced the error locally, and traced the failure to a missing key in the configuration file. She added validation logic to warn when required variables were absent and wrote an automated test to prevent future mistakes.

At 2:00 AM, Mei deployed the patched version and monitored the logs. No errors appeared. Satisfied, she sent a summary email to the team, explaining the root cause, fix steps, and preventive measures. The next morning, her manager praised her swift response and thorough documentation. Mei leaned back in her chair, feeling the satisfaction that comes from solving critical problems under tight deadlines. She closed her laptop and headed home, already planning improvements for the deployment pipeline to make it more resilient.`,
    difficulty: "intermediate",
    words: 210,
  },
  {
    id: "story-12",
    title: "The Plasma Reactor Paradox",
    content: `Professor Anika Hoffmann adjusted the parameters on her high-energy plasma reactor, monitoring the stochastic oscillations in the containment field. The reactor’s performance depended on maintaining coherence between the injected ion stream and the electromagnetic confinement grid. After several microsecond iterations, the oscillation amplitude spiked unexpectedly, threatening to destabilize the entire chamber. Hoffmann immediately initiated the emergency dampening protocol, reducing the energy input.

As the system stabilized, she reviewed the telemetry logs, identifying a nonlinear coupling between the magnetic coils and the plasma density waves. This insight suggested a potential optimization: by tuning the coil-phasing algorithm to account for higher-order harmonics, the reactor could achieve sustained output at reduced thermal loads. Hoffmann drafted a technical brief for her team, detailing the proposed algorithmic modification and outlining the next experimental sequence.`,
    difficulty: "advanced",
    words: 133,
  },
  {
    id: "story-13",
    title: "The Genomic Inversion Discovery",
    content: `In a dimly lit bioinformatics lab, Dr. Kamal Patel examined genomic alignments across multiple species to trace evolutionary variants. His custom alignment tool, optimized with a dynamic suffix array and wavelet-tree structure, revealed an unexpected inversion in the regulatory region of a conserved gene. This inversion correlated with phenotypic adaptations to high-altitude hypoxia observed in Andean populations. Intrigued, Patel designed a CRISPR-based assay to validate the functional impact of the inversion.

Over the weekend, he engineered guide RNAs targeting the inversion breakpoints and transfected them into cultured cell lines. The preliminary assays showed altered gene expression levels consistent with the hypothesized regulatory disruption. Patel prepared a comprehensive manuscript for submission to a leading genomics journal, arguing that these findings reshape our understanding of molecular adaptation.`,
    difficulty: "advanced",
    words: 128,
  },
  {
    id: "story-14",
    title: "The Deep-Sea Signal",
    content: `Dr. Mei-Ling Zhao navigated the autonomous deep-sea exploration vessel using the newly integrated sonar-mapping AI. The AI processed terabytes of acoustic data in real time, constructing high-resolution bathymetric maps of uncharted ocean trenches. At a depth of eleven thousand meters, the system detected anomalous acoustic reflections. Zhao dispatched an exploratory probe, which captured imagery of an unknown bioluminescent organism emitting pulsed photonic signals.

Analyzing the probe’s logs, Zhao hypothesized that the organism employed a previously undocumented communication mechanism. She uploaded the data to the research cluster and coordinated with marine biologists to schedule a follow-up mission. The discovery promised to expand the taxonomy of deep-sea fauna and offered insights into extreme-environment bio-communication strategies.`,
    difficulty: "advanced",
    words: 122,
  },
  {
    id: "story-15",
    title: "The Exoplanet Aperture",
    content: `When astrophysicist Dr. Rahul Verma configured the interferometric lenses for exoplanet detection, he calibrated the dual-spacecraft baseline to maximize angular resolution. The mission’s goal was to image surface features on Proxima Centauri b by synthesizing a virtual telescope aperture of two thousand kilometers. Despite solar wind fluctuations, Verma’s adaptive error-correction algorithm maintained phase coherence across the optical paths.

After weeks of calibration, the system produced the first resolved image showing potential polar ice caps. Verma cross-referenced the spectral data to confirm water-ice signatures and drafted an announcement to the planetary science consortium. His success signified a breakthrough in direct exoplanet observation techniques and opened new avenues for astrobiological exploration.`,
    difficulty: "advanced",
    words: 115,
  },
  {
    id: "story-16",
    title: "Zero-Trust Trading Platform",
    content: `In a bustling fintech startup, Elena Rossi led the implementation of a zero-trust security architecture for a microservices-based trading platform. She decomposed monolithic services into containerized components, securing each endpoint with mutual TLS and rolling out a service mesh with automatic sidecar proxies. Rossi also integrated a machine-learning anomaly detection engine to monitor transaction patterns and flag irregular behaviors in real time.

During the initial deployment, the anomaly engine detected an unusual surge in authentication failures originating from an external API gateway. Rossi traced the issue to a misconfigured token exchange flow. She updated the OAuth settings, deployed the fix, and validated the authentication workflow under simulated attack scenarios. The incidents and remediation steps were documented in the platform’s security runbook, reinforcing the company’s compliance posture and operational resilience.`,
    difficulty: "advanced",
    words: 134,
  },
  {
    id: "story-17",
    title: "The Rainy Day",
    content: `It was Monday morning when Emma looked outside and saw heavy rain pouring. She grabbed her bright yellow umbrella and rain boots before leaving home. At the bus stop, Emma noticed an old woman struggling with a broken umbrella. Emma walked over and offered to share hers. The woman smiled and accepted. They rode the bus together, chatting about the weather and their plans for the day. When Emma reached her stop, the woman thanked her kindly. Emma felt happy that a small act of kindness could brighten someone’s day.`,
    difficulty: "beginner",
    words: 90,
  },
  {
    id: "story-18",
    title: "The Lost Balloon",
    content: `During the school fair, Lucas held a bright red balloon that his friend had tied to his wrist. Suddenly, the string slipped, and the balloon floated up into the sky. Lucas watched it rise slowly, turning smaller and smaller. He felt sad but decided to make the best of the fair. He tried the ring toss, ate a sweet cotton candy, and played a game to win a stuffed animal. At the end of the day, Lucas returned home without his balloon but with a big smile because he had fun with his friends.`,
    difficulty: "beginner",
    words: 94,
  },
  {
    id: "story-19",
    title: "The Bakery Visit",
    content: `Sophie visited her grandmother’s bakery on Saturday morning. The air smelled of fresh bread and sweet pastries. She watched as her grandmother kneaded dough and shaped loaves of bread. After baking, her grandmother offered Sophie a warm croissant with chocolate filling. Sophie bit into it and closed her eyes in delight. She then helped to package muffins and cinnamon rolls for customers. As the bakery filled with the sound of the door chime, Sophie served coffee and greeted the early visitors. By noon, Sophie said goodbye and thanked her grandmother for a wonderful morning.`,
    difficulty: "beginner",
    words: 94,
  },
  {
    id: "story-20",
    title: "The Picnic Surprise",
    content: `On Sunday afternoon, Daniel and his friends planned a picnic in the park. They packed sandwiches, fruit, and lemonade in a large basket. When they arrived, they found the perfect spot under a wide oak tree. As they spread the blanket, a squirrel jumped nearby and looked at their food. Daniel tore a small piece of bread and offered it to the squirrel. To their surprise, the squirrel ate from Daniel’s hand. Everyone laughed and took turns feeding the friendly animal. After the picnic, they cleaned up and walked home, feeling happy and tired.`,
    difficulty: "beginner",
    words: 94,
  },
  {
    id: "story-21",
    title: "The New Bicycle",
    content: `Michael saved money for months to buy a new bicycle. He researched different models and finally chose a blue mountain bike. On Saturday, he went to the bike shop with his parents. He tried the bike, adjusted the seat, and practiced riding in the parking lot. The shop owner gave him a helmet and safety tips. Michael pedaled down the sidewalk with confidence, feeling the wind on his face. He rode past trees and friendly neighbors who waved at him. At home, he parked the bike in the garage and planned a longer ride for the next weekend.`,
    difficulty: "beginner",
    words: 98,
  }
];
