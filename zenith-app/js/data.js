/* ============================================================
   ZENITH DATA LAYER
   Complete session library with clinical metadata
   ============================================================ */

const ZenithData = {
    // ── Platform Configurations ──
    platforms: {
        schools: {
            id: 'schools',
            title: 'Schools & Colleges',
            icon: '🎓',
            description: 'Mental wellness support for students including focus training, exam stress relief, emotional regulation, and sleep support.',
            themeColor: '#10b981', // Emerald
            categories: ['focus', 'anxiety', 'examFear', 'stress', 'sleep'],
            features: [
                'Student Mental Wellness',
                'Daily Mood Check',
                'Focus Training',
                'Exam Stress Support',
                'Counselor Integration'
            ],
            route: '/schools'
        },
        corporate: {
            id: 'corporate',
            title: 'Corporate Leaders',
            icon: '🏢',
            description: 'Programs designed for professionals to improve focus, reduce stress, prevent burnout, and enhance performance.',
            themeColor: '#14b8a6', // Teal
            categories: ['focus', 'relaxation', 'stress', 'sleep'],
            features: [
                'Burnout Recovery',
                'Focus Training',
                'Leadership Resilience',
                'Workplace Wellbeing Analytics'
            ],
            route: '/corporate'
        },
        government: {
            id: 'government',
            title: 'Government Employees',
            icon: '🏛️',
            description: 'Mental clarity and resilience programs designed for public service professionals managing high responsibility.',
            themeColor: '#6366f1', // Indigo
            categories: ['focus', 'stress', 'mentalClarity', 'sleep'],
            features: [
                'Decision Clarity',
                'Stress Regulation',
                'High Pressure Leadership Training'
            ],
            route: '/government'
        },
        defense: {
            id: 'defense',
            title: 'Police & Military personnel',
            icon: '⚔️',
            description: 'Trauma-informed practices, nervous system regulation, stress recovery, and operational resilience.',
            themeColor: '#f59e0b', // Amber
            categories: ['stressRecovery', 'focus', 'sleepRecovery', 'emotionalRegulation'],
            features: [
                'Trauma-informed Meditation',
                'Combat Stress Recovery',
                'Nervous System Regulation',
                'Sleep Recovery'
            ],
            route: '/defense'
        }
    },

    // ── Session Durations ──
    durations: [5, 10, 15, 21, 30, 45, 60],

    // ── Categories ──
    categories: [
        { id: 'all', label: 'All', icon: '✦' },
        { id: 'focus', label: 'Focus', icon: '🎯' },
        { id: 'stress', label: 'Stress', icon: '⚡' },
        { id: 'sleep', label: 'Sleep', icon: '🌙' },
        { id: 'anxiety', label: 'Anxiety', icon: '🌊' },
        { id: 'examFear', label: 'Exam Fear', icon: '📚' },
        { id: 'relaxation', label: 'Relaxation', icon: '🏖️' },
        { id: 'mentalClarity', label: 'Mental Clarity', icon: '💎' },
        { id: 'stressRecovery', label: 'Stress Recovery', icon: '🛡️' },
        { id: 'sleepRecovery', label: 'Sleep Recovery', icon: '🛌' },
        { id: 'emotionalRegulation', label: 'Regulation', icon: '⚖️' },
        { id: 'burnout', label: 'Burnout', icon: '🔥' },
        { id: 'depression', label: 'Depression', icon: '☀️' }
    ],

    // ── Levels ──
    levels: ['Beginner', 'Intermediate', 'Advanced'],

    // ── Therapists ──
    therapists: [
        { id: 'elena', name: 'Dr. Elena Vasquez', specialty: 'CBT & Stress Management', avatar: 'EV' },
        { id: 'james', name: 'Dr. James Chen', specialty: 'Sleep Science & MBSR', avatar: 'JC' },
        { id: 'sarah', name: 'Dr. Sarah Mitchell', specialty: 'Polyvagal Therapy', avatar: 'SM' },
        { id: 'raj', name: 'Dr. Raj Patel', specialty: 'Breathwork & Anxiety', avatar: 'RP' },
        { id: 'maya', name: 'Maya Thompson', specialty: 'Compassion-Based Therapy', avatar: 'MT' }
    ],

    // ── Complete Session Library ──
    sessions: [
        // ═══════════════════════════════════════════
        // 5-MINUTE SESSIONS
        // ═══════════════════════════════════════════
        {
            id: 's5-1',
            title: 'Immediate Calming Breath Reset',
            duration: 5,
            category: 'stress',
            level: 'Beginner',
            therapist: 'raj',
            thumbGradient: 'thumb-gradient-1',
            thumbIcon: '🌬️',
            description: 'A rapid-response breathing protocol designed for high-pressure moments. Uses the physiological sigh technique to activate your parasympathetic nervous system within 90 seconds, bringing immediate calm between meetings or after stressful interactions.',
            psychologicalGoal: 'Immediate autonomic nervous system regulation. Shifts from sympathetic (fight-or-flight) to parasympathetic (rest-and-digest) dominance within the session duration.',
            neuroscienceBasis: '5 minutes is the minimum effective dose for vagal tone activation. Research shows the physiological sigh (double inhale + extended exhale) is the fastest known voluntary method to reduce cortisol and adrenaline levels.',
            techniques: ['Breathwork', 'Vagal Toning'],
            voiceTone: 'Calm, measured pace. 3-second pauses between instructions. Warm, grounding baritone.',
            backgroundAudio: 'Minimal — soft binaural beats at 10 Hz (alpha wave range)',
            tags: ['Pre-Meeting', 'Quick Reset', 'Emergency'],
            platforms: ['corporate', 'government', 'defense']
        },
        {
            id: 's5-2',
            title: 'Pre-Meeting Anxiety Reduction',
            duration: 5,
            category: 'anxiety',
            level: 'Beginner',
            therapist: 'elena',
            thumbGradient: 'thumb-gradient-2',
            thumbIcon: '🎯',
            description: 'A targeted micro-intervention for the 5 minutes before an important meeting, presentation, or difficult conversation. Combines cognitive reframing with box breathing to transform anxiety into focused energy.',
            psychologicalGoal: 'Reframe anticipatory anxiety as readiness energy. Reduce catastrophic thinking patterns that spike before high-stakes professional interactions.',
            neuroscienceBasis: 'Pre-performance anxiety peaks 5–10 minutes before an event. This window is optimal for intervention because the prefrontal cortex is still accessible for cognitive reframing before amygdala hijack.',
            techniques: ['CBT', 'Breathwork'],
            voiceTone: 'Confident, supportive. Slightly faster pace to match heightened arousal state, then gradually slowing.',
            backgroundAudio: 'Office-ambient masking with subtle 12 Hz binaural beats',
            tags: ['Pre-Meeting', 'Performance', 'Fast'],
            platforms: ['corporate', 'government']
        },
        {
            id: 's5-3',
            title: 'Emotional Reset After Conflict',
            duration: 5,
            category: 'stress',
            level: 'Beginner',
            therapist: 'sarah',
            thumbGradient: 'thumb-gradient-3',
            thumbIcon: '🔄',
            description: 'A post-conflict recovery protocol for after a tense email exchange, disagreement with a colleague, or frustrating meeting. Processes the emotional residue and restores your professional composure.',
            psychologicalGoal: 'Discharge emotional charge from interpersonal conflict. Prevent emotional carry-over from contaminating subsequent interactions.',
            neuroscienceBasis: 'The emotional residue from conflict persists for approximately 20 minutes (cortisol half-life). A 5-minute intervention during this window can significantly reduce rumination loops and prevent emotional hijacking of the next interaction.',
            techniques: ['Polyvagal', 'Breathwork'],
            voiceTone: 'Empathetic, validating. Slow, warm tone acknowledging the difficulty of the experience.',
            backgroundAudio: 'Gentle white noise with soft ambient tones',
            tags: ['Post-Conflict', 'Recovery', 'Office'],
            platforms: ['corporate', 'government', 'defense', 'schools']
        },

        // ═══════════════════════════════════════════
        // 10-MINUTE SESSIONS
        // ═══════════════════════════════════════════
        {
            id: 's10-1',
            title: 'Guided Grounding Practice',
            duration: 10,
            category: 'anxiety',
            level: 'Beginner',
            therapist: 'sarah',
            thumbGradient: 'thumb-gradient-4',
            thumbIcon: '🌍',
            description: 'A comprehensive 5-4-3-2-1 sensory grounding exercise enhanced with progressive body awareness. Ideal during a commute or short break when anxiety feels unmanageable.',
            psychologicalGoal: 'Full sensory reorientation to the present moment, breaking the anxiety-future-catastrophizing loop. Establishes cognitive-somatic reconnection.',
            neuroscienceBasis: '10 minutes allows completion of the full grounding cycle: 2 minutes orientation, 5 minutes sensory engagement, 3 minutes integration. This duration activates the insular cortex, which manages interoception and reduces dissociative anxiety responses.',
            techniques: ['MBSR', 'Polyvagal'],
            voiceTone: 'Steady, grounding. Each instruction delivered with deliberate pace. Uses directional language ("feel the ground beneath you").',
            backgroundAudio: 'Nature sounds — gentle stream with bird calls. No binaural beats.',
            tags: ['Commute', 'Break', 'Grounding'],
            platforms: ['schools', 'corporate', 'government', 'defense']
        },
        {
            id: 's10-2',
            title: 'Micro-CBT Intervention',
            duration: 10,
            category: 'stress',
            level: 'Intermediate',
            therapist: 'elena',
            thumbGradient: 'thumb-gradient-5',
            thumbIcon: '🧠',
            description: 'A structured cognitive behavioral therapy mini-session. Identifies one automatic negative thought, examines the evidence, and constructs a balanced alternative thought — all within 10 minutes.',
            psychologicalGoal: 'Interrupt a specific thought-emotion-behavior cycle. Build meta-cognitive awareness of automatic negative thoughts that drive workplace stress.',
            neuroscienceBasis: '10 minutes is sufficient for one complete thought record cycle. The dorsolateral prefrontal cortex needs approximately 3 minutes of focused engagement to override amygdala-driven emotional responses.',
            techniques: ['CBT'],
            voiceTone: 'Professional, structured. Clear prompts with pauses for reflection. Slightly didactic but warm.',
            backgroundAudio: 'Minimal white noise, low volume',
            tags: ['Cognitive', 'Thought Work', 'Mid-Day']
        },
        {
            id: 's10-3',
            title: 'Nervous System Downregulation',
            duration: 10,
            category: 'stress',
            level: 'Beginner',
            therapist: 'raj',
            thumbGradient: 'thumb-gradient-1',
            thumbIcon: '🌿',
            description: 'A progressive calming sequence that systematically reduces physiological arousal. Uses extended exhale breathing, progressive muscle relaxation of the upper body, and vocal humming to stimulate the vagus nerve.',
            psychologicalGoal: 'Shift the autonomic nervous system from chronic sympathetic activation (common in high-stress roles) to parasympathetic recovery.',
            neuroscienceBasis: '10 minutes of vagal stimulation through humming and extended exhales can measurably reduce heart rate variability irregularities. The vagus nerve response begins within 30 seconds but requires 8–10 minutes for systemic effect.',
            techniques: ['Polyvagal', 'Breathwork'],
            voiceTone: 'Very slow, deep. Long silences. Occasional humming demonstration.',
            backgroundAudio: 'Binaural beats at 7.83 Hz (Schumann resonance)',
            tags: ['After Work', 'Recovery', 'Physical']
        },

        // ═══════════════════════════════════════════
        // 15-MINUTE SESSIONS
        // ═══════════════════════════════════════════
        {
            id: 's15-1',
            title: 'Stress Processing Protocol',
            duration: 15,
            category: 'stress',
            level: 'Intermediate',
            therapist: 'elena',
            thumbGradient: 'thumb-gradient-6',
            thumbIcon: '🌊',
            description: 'A structured stress-processing session that takes you through identification, acknowledgment, somatic experiencing, and release of accumulated workplace stress. Includes journaling prompts.',
            psychologicalGoal: 'Process rather than suppress accumulated stress. Transform vague anxiety into identifiable, manageable stress components.',
            neuroscienceBasis: '15 minutes enables completion of the full stress response cycle. The body needs approximately 12 minutes minimum to complete the chemical cascade from cortisol release to metabolization when given conscious support.',
            techniques: ['MBSR', 'CBT'],
            voiceTone: 'Empathetic, inquiry-based. Asks reflective questions with 10–15 second pauses for internal processing.',
            backgroundAudio: 'Ambient ocean waves with subtle 8 Hz binaural beats',
            tags: ['Lunch Break', 'Processing', 'Mid-Day']
        },
        {
            id: 's15-2',
            title: 'Quick Body Scan Journey',
            duration: 15,
            category: 'anxiety',
            level: 'Beginner',
            therapist: 'james',
            thumbGradient: 'thumb-gradient-7',
            thumbIcon: '✨',
            description: 'A comprehensive body scan that maps tension patterns from head to toe. Particularly effective for desk workers who accumulate tension in shoulders, jaw, and lower back without awareness.',
            psychologicalGoal: 'Develop interoceptive awareness of stress storage patterns. Release unconscious muscular tension that amplifies psychological stress.',
            neuroscienceBasis: '15 minutes allows a complete head-to-toe scan at the optimal pace of approximately 1 minute per body region. This duration activates the somatosensory cortex and insular cortex simultaneously, creating a body-mind integration effect.',
            techniques: ['MBSR', 'Polyvagal'],
            voiceTone: 'Slow, methodical. Moves systematically through body regions with gentle descriptive language.',
            backgroundAudio: 'Soft ambient pads, no rhythm',
            tags: ['Body Scan', 'Physical', 'Desk Work']
        },
        {
            id: 's15-3',
            title: 'Focus Restoration Session',
            duration: 15,
            category: 'focus',
            level: 'Beginner',
            therapist: 'raj',
            thumbGradient: 'thumb-gradient-2',
            thumbIcon: '💎',
            description: 'A cognitive refresh designed for the afternoon slump or after sustained periods of concentration. Uses attention-switching exercises and micro-meditation to restore depleted executive function.',
            psychologicalGoal: 'Replenish depleted attentional resources. Restore prefrontal cortex function after sustained cognitive load.',
            neuroscienceBasis: 'Focused attention depletes glucose in the prefrontal cortex over 90-minute cycles. A 15-minute reset allows partial glycogen replenishment and default mode network activation, which research shows restores decision-making quality by 40%.',
            techniques: ['MBSR', 'Breathwork'],
            voiceTone: 'Gentle but progressively more focused. Transitions from soft to clear and energizing.',
            backgroundAudio: 'Binaural beats at 14 Hz (beta wave, low range) for the final 5 minutes',
            tags: ['Afternoon', 'Cognitive', 'Productivity'],
            platforms: ['schools', 'corporate', 'government']
        },

        // ═══════════════════════════════════════════
        // 21-MINUTE SESSIONS
        // ═══════════════════════════════════════════
        {
            id: 's21-1',
            title: 'Deep Relaxation Cycle',
            duration: 21,
            category: 'stress',
            level: 'Intermediate',
            therapist: 'james',
            thumbGradient: 'thumb-gradient-3',
            thumbIcon: '🌀',
            description: 'A precisely timed 21-minute deep relaxation protocol based on NASA research showing that 21 minutes is the optimal duration for a complete neural reset. Combines progressive relaxation with visualization.',
            psychologicalGoal: 'Achieve full parasympathetic dominance and mental clarity. Complete one full relaxation cycle from tension identification through release to integration.',
            neuroscienceBasis: '21 minutes matches the ultradian rhythm mini-cycle. NASA research on pilot fatigue found that a 21-minute reset improves subsequent alertness by 34% and cognitive performance by 16%. This duration allows one complete cycle of the default mode network.',
            techniques: ['MBSR', 'Breathwork'],
            voiceTone: 'Deeply calming. Long, flowing sentences. Voice gradually lowers in pitch and volume.',
            backgroundAudio: 'Layered ambient — binaural beats at 6 Hz, nature sounds, soft pads',
            tags: ['Deep Rest', 'Mid-Day', 'Reset']
        },
        {
            id: 's21-2',
            title: 'Anxiety Decompression',
            duration: 21,
            category: 'anxiety',
            level: 'Intermediate',
            therapist: 'sarah',
            thumbGradient: 'thumb-gradient-4',
            thumbIcon: '🫧',
            description: 'A comprehensive anxiety decompression session that works through three layers: cognitive (thought patterns), somatic (body sensations), and emotional (underlying feelings). Uses the RAIN technique enhanced with polyvagal exercises.',
            psychologicalGoal: 'Decompress multi-layered anxiety into identifiable components. Develop the capacity to sit with discomfort without reactivity.',
            neuroscienceBasis: '21 minutes enables full processing of all three anxiety layers (cognitive: 7 min, somatic: 7 min, emotional: 7 min). The tripartite brain model response requires this duration for complete integration across the neocortex, limbic system, and brainstem.',
            techniques: ['CBT', 'Polyvagal', 'MBSR'],
            voiceTone: 'Warm, non-judgmental. Uses metaphorical language. Gradual shifts between directive and spacious.',
            backgroundAudio: 'Rain sounds with subtle binaural beats at 7 Hz (theta-alpha boundary)',
            tags: ['Deep Work', 'Processing', 'Comprehensive']
        },
        {
            id: 's21-3',
            title: 'Polyvagal Regulation Session',
            duration: 21,
            category: 'stress',
            level: 'Advanced',
            therapist: 'sarah',
            thumbGradient: 'thumb-gradient-5',
            thumbIcon: '🌿',
            description: 'An advanced session based on Stephen Porges\' polyvagal theory. Guides you through mapping your nervous system states, identifying where you are on the vagal ladder, and using targeted exercises to return to ventral vagal (social engagement) state.',
            psychologicalGoal: 'Develop neural pathway flexibility between sympathetic and parasympathetic states. Build capacity for nervous system self-regulation under chronic occupational stress.',
            neuroscienceBasis: 'Polyvagal state shifting requires approximately 7 minutes per state level (dorsal vagal → sympathetic → ventral vagal). The 21-minute duration allows a complete vagal ladder traversal with integration time.',
            techniques: ['Polyvagal', 'Breathwork'],
            voiceTone: 'Expert, warmly clinical. Educational segments interspersed with experiential exercises.',
            backgroundAudio: 'Low-frequency humming drones at 136.1 Hz (OM frequency) with nature sounds',
            tags: ['Advanced', 'Nervous System', 'Regulation'],
            platforms: ['defense', 'government']
        },

        // ═══════════════════════════════════════════
        // 30-MINUTE SESSIONS
        // ═══════════════════════════════════════════
        {
            id: 's30-1',
            title: 'Structured CBT Reflection',
            duration: 30,
            category: 'stress',
            level: 'Intermediate',
            therapist: 'elena',
            thumbGradient: 'thumb-gradient-1',
            thumbIcon: '📋',
            description: 'A full structured CBT session including: situation analysis, automatic thought identification, cognitive distortion labeling, evidence examination, and balanced thought construction. Includes a behavioral experiment design for the coming week.',
            psychologicalGoal: 'Complete a full cognitive behavioral therapy cycle on a specific workplace stressor. Build lasting cognitive restructuring skills that transfer to daily situations.',
            neuroscienceBasis: '30 minutes matches a standard therapeutic half-session. This duration allows full engagement of the prefrontal cortex for metacognition while maintaining attention before cognitive fatigue sets in (typically at 45 minutes for self-guided work).',
            techniques: ['CBT'],
            voiceTone: 'Professional, structured, warm. Therapist-like delivery with clear prompts and generous reflection pauses.',
            backgroundAudio: 'Minimal — soft white noise at low volume',
            tags: ['Therapeutic', 'Deep Work', 'Weekend']
        },
        {
            id: 's30-2',
            title: 'Burnout Prevention Module',
            duration: 30,
            category: 'burnout',
            level: 'Intermediate',
            therapist: 'elena',
            thumbGradient: 'thumb-gradient-6',
            thumbIcon: '🛡️',
            description: 'A comprehensive burnout assessment and prevention session. Evaluates your current position on the Maslach Burnout Inventory dimensions (exhaustion, cynicism, reduced efficacy) and provides targeted interventions for your specific burnout profile.',
            psychologicalGoal: 'Identify early-stage burnout indicators before they become critical. Develop a personalized recovery micro-plan targeting the most affected dimension.',
            neuroscienceBasis: '30 minutes is required to move through all three burnout dimensions with adequate processing time. Burnout involves sustained HPA axis dysregulation, and this session duration allows cortisol regulation to begin during the session itself.',
            techniques: ['CBT', 'MBSR'],
            voiceTone: 'Compassionate, validating. Normalizes the burnout experience without enabling. Empowering language.',
            backgroundAudio: 'Gentle acoustic guitar with ambient nature sounds',
            tags: ['Burnout', 'Prevention', 'Assessment']
        },
        {
            id: 's30-3',
            title: 'Emotional Processing Practice',
            duration: 30,
            category: 'depression',
            level: 'Intermediate',
            therapist: 'maya',
            thumbGradient: 'thumb-gradient-7',
            thumbIcon: '💜',
            description: 'A gentle guided practice for processing suppressed emotions common in professional environments. Uses the Focusing technique developed by Eugene Gendlin, allowing emotions to surface, be acknowledged, and integrate.',
            psychologicalGoal: 'Create safe internal space for emotional processing. Reduce the cognitive load of emotional suppression that contributes to workplace depression and fatigue.',
            neuroscienceBasis: '30 minutes enables the "felt sense" (Gendlin\'s concept) to emerge, which typically requires 15–20 minutes of patient attention. The remaining time allows for integration, which activates the dorsomedial prefrontal cortex for emotional regulation.',
            techniques: ['MBSR', 'Polyvagal'],
            voiceTone: 'Very gentle, unhurried. Spacious delivery with long comfortable silences. No urgency.',
            backgroundAudio: 'Soft piano with ambient pads',
            tags: ['Emotional', 'Processing', 'Evening'],
            platforms: ['schools', 'corporate', 'government', 'defense']
        },
        {
            id: 's30-4',
            title: 'Harmonic Flow: Ground & Activate',
            duration: 30,
            category: 'stress',
            level: 'Intermediate',
            therapist: 'raj',
            thumbGradient: 'thumb-gradient-3',
            thumbIcon: '🌊',
            description: 'A complete 30-minute journey through grounding, Wim Hof-inspired breathing, and deep integration. Perfect for full nervous system recalibration.',
            psychologicalGoal: 'Complete autonomic recalibration. Shifts from deep grounding to high-energy mobilization and back to profound somatic stillness.',
            neuroscienceBasis: 'Combines multiple regulatory loops: brain-heart coherence for initial stabilization, hyper-oxygenation for systemic mobilization, and humming for vagal down-regulation.',
            techniques: ['Breathwork', 'MBSR', 'Polyvagal'],
            voiceTone: 'Warm, human, compassionate. Deeply grounding with natural rhythmic pauses.',
            backgroundAudio: 'Evolving atmospheric pads and rhythmic pulses',
            tags: ['Harmonic', 'Breathwork', 'Deep Dive']
        },

        // ═══════════════════════════════════════════
        // 45-MINUTE SESSIONS
        // ═══════════════════════════════════════════
        {
            id: 's45-1',
            title: 'Deep Stress Release Journey',
            duration: 45,
            category: 'stress',
            level: 'Advanced',
            therapist: 'james',
            thumbGradient: 'thumb-gradient-2',
            thumbIcon: '🌌',
            description: 'A comprehensive stress release combining breathwork, body scan, progressive relaxation, and guided visualization. Takes you through a complete journey from high stress to deep calm, with an integration phase to carry the calm forward.',
            psychologicalGoal: 'Achieve deep systemic stress release. Process accumulated chronic stress that brief sessions cannot fully address.',
            neuroscienceBasis: '45 minutes allows two complete ultradian rhythm mini-cycles. Deep stress release requires approximately 30 minutes for full HPA axis downregulation, plus 15 minutes for neuroplastic integration — the period where new neural pathways for calm responses begin forming.',
            techniques: ['MBSR', 'Polyvagal', 'Breathwork'],
            voiceTone: 'Journey-like narration. Begins with gentle urgency, transitions to deeply peaceful. Rich, evocative language.',
            backgroundAudio: 'Multi-layered: binaural beats (4–8 Hz), nature sounds, ambient drones, transitions between phases',
            tags: ['Deep Release', 'Evening', 'Weekend']
        },
        {
            id: 's45-2',
            title: 'Sleep Preparation Protocol',
            duration: 45,
            category: 'sleep',
            level: 'Intermediate',
            therapist: 'james',
            thumbGradient: 'thumb-gradient-3',
            thumbIcon: '🌙',
            description: 'A structured pre-sleep protocol designed for professionals who struggle to "switch off" after intense workdays. Includes: cognitive offloading (writing tomorrow\'s worries), body-based relaxation, and a gradual descent into sleep-ready state.',
            psychologicalGoal: 'Bridge the gap between high-performance work mode and sleep-ready state. Reduce sleep onset latency by addressing the cognitive hyperarousal common in high-responsibility roles.',
            neuroscienceBasis: '45 minutes maps to the natural pre-sleep transition window. Melatonin production begins approximately 2 hours before natural sleep time, and this session is designed to work with that hormonal cascade. The progressive decrease in cognitive engagement mirrors the natural decrease in cortical arousal measured by EEG in healthy sleep onset.',
            techniques: ['MBSR', 'Sleep Hygiene', 'Polyvagal'],
            voiceTone: 'Progressively slower and softer. Voice drops in pitch and volume across the session. Final 10 minutes are near-whisper.',
            backgroundAudio: 'Pink noise with binaural beats descending from 8 Hz to 4 Hz (theta to delta wave transition)',
            tags: ['Sleep', 'Evening', 'Bedtime'],
            platforms: ['defense', 'corporate', 'government']
        },
        {
            id: 's45-3',
            title: 'Compassion-Based Therapy Session',
            duration: 45,
            category: 'burnout',
            level: 'Intermediate',
            therapist: 'maya',
            thumbGradient: 'thumb-gradient-4',
            thumbIcon: '❤️',
            description: 'Based on Paul Gilbert\'s Compassion Focused Therapy (CFT), this session develops the three emotional regulation systems: threat, drive, and soothing. Particularly effective for self-critical professionals driven by perfectionism.',
            psychologicalGoal: 'Activate the soothing/affiliative system, which is typically underdeveloped in high-achieving professionals. Reduce the toxic self-criticism that drives burnout cycles.',
            neuroscienceBasis: '45 minutes allows full activation of the oxytocin and endorphin systems that underpin compassionate responses. Self-compassion meditation research shows that measurable changes in self-criticism patterns require at least 30 minutes, with 15 additional minutes for the compassionate letter-writing integration exercise.',
            techniques: ['CBT', 'MBSR'],
            voiceTone: 'Warm, nurturing without being patronizing. Models self-compassionate inner dialogue.',
            backgroundAudio: 'Gentle heartbeat rhythm with soft ambient pads',
            tags: ['Self-Compassion', 'Perfectionism', 'Deep Work']
        },

        // ═══════════════════════════════════════════
        // 60-MINUTE SESSIONS
        // ═══════════════════════════════════════════
        {
            id: 's60-1',
            title: 'Full Guided Sleep Journey',
            duration: 60,
            category: 'sleep',
            level: 'Beginner',
            therapist: 'james',
            thumbGradient: 'thumb-gradient-5',
            thumbIcon: '✨',
            description: 'A complete 60-minute sleep journey designed to replace sleep medication for professionals struggling with insomnia. Begins with cognitive offloading, moves through progressive body relaxation, into yoga nidra-style "sleep-wake" state, and finally into guided sleep onset.',
            psychologicalGoal: 'Achieve natural sleep onset by completing the full cognitive-somatic wind-down sequence. Train the brain to associate the session with sleep onset (classical conditioning over time).',
            neuroscienceBasis: '60 minutes maps to the complete sleep architecture transition: 20 minutes for cognitive settling (prefrontal cortex deactivation), 20 minutes for somatic relaxation (muscle spindle fatigue), and 20 minutes for guided descent through N1 to N2 sleep stages. EEG studies show this duration achieves delta wave dominance (0.5–4 Hz) in 78% of participants.',
            techniques: ['Sleep Hygiene', 'MBSR', 'Polyvagal'],
            voiceTone: 'Begins warm and conversational, becomes progressively slower, softer, more spacious. Final 15 minutes may have minutes of silence between phrases.',
            backgroundAudio: 'Evolving soundscape: rain → ocean → pink noise. Binaural beats descend from 10 Hz to 2 Hz over the hour.',
            tags: ['Sleep', 'Insomnia', 'Full Journey']
        },
        {
            id: 's60-2',
            title: 'Depression-Support Reflective Session',
            duration: 60,
            category: 'depression',
            level: 'Advanced',
            therapist: 'maya',
            thumbGradient: 'thumb-gradient-6',
            thumbIcon: '☀️',
            description: 'A comprehensive support session for mild-to-moderate depression. Combines behavioral activation principles, cognitive restructuring, self-compassion meditation, and values clarification. This is NOT a replacement for therapy but a structured self-help complement.',
            psychologicalGoal: 'Interrupt the depression withdrawal cycle. Reconnect with personal values and identify one small behavioral activation step. Reduce rumination through structured cognitive engagement.',
            neuroscienceBasis: '60 minutes is the standard therapeutic session length. For depression, this duration is needed to move through the characteristic "inertia barrier" (15–20 minutes), reach productive reflection (20 minutes), and achieve cognitive restructuring with behavioral planning (20 minutes). Serotonin and dopamine pathway activation through guided positive imagery requires sustained engagement.',
            techniques: ['CBT', 'MBSR', 'Breathwork'],
            voiceTone: 'Gentle, patient, validating. No toxic positivity. Acknowledges difficulty. Gradually introduces hope and agency.',
            backgroundAudio: 'Warm ambient music transitioning from minor to major key. Soft morning sounds in the final section.',
            tags: ['Depression', 'Support', 'Weekend']
        },
        {
            id: 's60-3',
            title: 'Nervous System Recalibration Program',
            duration: 60,
            category: 'stress',
            level: 'Advanced',
            therapist: 'sarah',
            thumbGradient: 'thumb-gradient-7',
            thumbIcon: '🌐',
            description: 'A full-length nervous system recalibration combining all major therapeutic modalities. Works through the complete polyvagal ladder, integrates breathwork cycles, includes somatic experiencing, and finishes with a future-self visualization anchored in safety.',
            psychologicalGoal: 'Complete nervous system recalibration for chronic stress recovery. Build a new baseline of calm that persists beyond the session through neuroplastic integration techniques.',
            neuroscienceBasis: '60 minutes allows three full ultradian rhythm mini-cycles, enabling deep neuroplastic change. Research on meditation practitioners shows that sustained practice above 45 minutes activates the default mode network in ways associated with lasting trait changes (vs. temporary state changes). The nervous system requires this extended period for genuine recalibration of baseline arousal levels.',
            techniques: ['Polyvagal', 'MBSR', 'Breathwork', 'CBT'],
            voiceTone: 'Master-class delivery. Authoritative yet deeply compassionate. Guides through challenging territory with confidence.',
            backgroundAudio: 'Full soundscape design: binaural beats, nature sounds, tonal drones, singing bowls. Audio evolves through distinct phases.',
            tags: ['Advanced', 'Recalibration', 'Weekend']
        }
    ],

    // ── User Profile (Initialized from Auth/DB) ──
    user: {
        id: null,
        name: 'User',
        email: '',
        age: null,
        gender: null,
        wellnessGoal: 'stress',
        experienceLevel: 'Beginner',
        preferredSessionTime: null,
        programType: 7,
        role: 'member',
        organization: null,
        organizationType: null,
        avatar: 'U',
        joinDate: new Date().toISOString().split('T')[0],
        totalSessions: 0,
        totalMinutesPracticed: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyGoal: 5,
        weeklyCompleted: 0,
        currentMood: null,
        stressLevel: 5,
        sleepQuality: 5,
        burnoutScore: 0,
        calendarLoad: 'moderate',

        // Mood History (Fetched from DB)
        moodHistory: [],

        // Sleep history (7 days)
        sleepHistory: [0, 0, 0, 0, 0, 0, 0],

        // Session history (last 7 days)
        sessionHistory: [0, 0, 0, 0, 0, 0, 0],

        // Completed session IDs
        completedSessions: []
    },

    // ── Achievement Definitions ──
    achievements: [
        { id: 'first-session', name: 'First Step', icon: '🌱', description: 'Complete your first session', unlocked: true },
        { id: 'week-streak', name: '7-Day Streak', icon: '🔥', description: 'Practice 7 days in a row', unlocked: true },
        { id: 'night-owl', name: 'Night Owl', icon: '🦉', description: 'Complete 5 sleep sessions', unlocked: true },
        { id: 'stress-warrior', name: 'Stress Warrior', icon: '⚔️', description: 'Complete 10 stress sessions', unlocked: false },
        { id: 'deep-diver', name: 'Deep Diver', icon: '🌊', description: 'Complete a 60-minute session', unlocked: false },
        { id: 'consistent', name: 'Consistency', icon: '💎', description: '30-day streak', unlocked: false }
    ],

    // ── AI Recommendations Logic ──
    getRecommendations() {
        const hour = new Date().getHours();
        const { stressLevel, sleepQuality, calendarLoad, burnoutScore, completedSessions } = this.user;
        const recommended = [];

        // Time-of-day based
        if (hour >= 6 && hour < 9) {
            // Morning — energizing, focus
            recommended.push('s5-2', 's15-3', 's10-1');
        } else if (hour >= 9 && hour < 12) {
            // Work morning — stress management
            recommended.push('s5-1', 's10-2', 's15-1');
        } else if (hour >= 12 && hour < 14) {
            // Lunch — moderate sessions
            recommended.push('s15-1', 's21-1', 's10-1');
        } else if (hour >= 14 && hour < 17) {
            // Afternoon — focus restoration
            recommended.push('s15-3', 's5-1', 's10-3');
        } else if (hour >= 17 && hour < 20) {
            // Evening — decompression
            recommended.push('s21-2', 's30-3', 's45-1');
        } else if (hour >= 20 || hour < 6) {
            // Night — sleep & deep work
            recommended.push('s45-2', 's60-1', 's30-3');
        }

        // Stress-adjusted
        if (stressLevel >= 7) {
            recommended.unshift('s5-1', 's10-3');
        }

        // Calendar-adjusted
        if (calendarLoad === 'heavy') {
            // Prefer shorter sessions
            recommended.unshift('s5-1', 's5-2', 's10-2');
        }

        // Burnout-adjusted
        if (burnoutScore > 50) {
            recommended.unshift('s30-2', 's45-3');
        }

        // Deduplicate and limit
        const unique = [...new Set(recommended)];
        return unique.slice(0, 6).map(id => this.sessions.find(s => s.id === id)).filter(Boolean);
    },

    getSessionById(id) {
        if (id === 'CUSTOM') {
            return {
                id: 'CUSTOM',
                title: 'Personal Session',
                duration: 0, // Will be updated by MP3 metadata
                category: 'custom',
                therapist: 'none',
                description: 'A custom session using your uploaded MP3 narration overlayed with real-time binaural beats.',
                voiceTone: 'Your uploaded audio',
                backgroundAudio: 'Real-time binaural beats (Alpha/Theta)'
            };
        }

        let session = this.sessions.find(s => s.id === id);

        // Check in ResilienceProgramData if not found in standard sessions
        if (!session && typeof ResilienceProgramData !== 'undefined') {
            const resSession = ResilienceProgramData.find(s => s.id === id);
            if (resSession) {
                session = {
                    ...resSession,
                    category: 'stress', // Default category for resilience program for UI matching
                    level: 'Intermediate',
                    therapist: 'raj', // Default therapist for resilience
                    thumbGradient: 'thumb-gradient-3', // Default gradient
                    thumbIcon: '🧘',
                    description: resSession.meditation_focus,
                    psychologicalGoal: 'Nervous system regulation and mental resilience.',
                    neuroscienceBasis: 'Based on polyvagal theory and NASA-derived rest cycles.',
                    techniques: ['Breathwork', 'Meditation', 'Bhramari'],
                    voiceTone: 'Calm, authoritative, professional.',
                    backgroundAudio: 'Ambient theta waves with binaural beats.',
                    tags: ['Resilience', 'Premium', 'Program']
                };
            }
        }

        return session;
    },

    getTherapistById(id) {
        return this.therapists.find(t => t.id === id);
    },

    getSessionsByDuration(duration) {
        return this.sessions.filter(s => s.duration === duration);
    },

    getSessionsByCategory(category) {
        if (category === 'all') return this.sessions;
        return this.sessions.filter(s => s.category === category);
    },

    getFilteredSessions(duration, category) {
        let filtered = this.sessions;
        if (duration) filtered = filtered.filter(s => s.duration === duration);
        if (category && category !== 'all') filtered = filtered.filter(s => s.category === category);

        // Final platform safety filter
        if (ZenithState.currentPlatform) {
            filtered = filtered.filter(s => s.platforms && s.platforms.includes(ZenithState.currentPlatform));
        }

        return filtered;
    },

    getFeaturedSession() {
        // Time-aware featured session
        const hour = new Date().getHours();
        if (hour >= 20 || hour < 6) return this.getSessionById('s60-1');
        if (hour >= 6 && hour < 9) return this.getSessionById('s15-3');
        if (hour >= 14 && hour < 17) return this.getSessionById('s21-1');
        return this.getSessionById('s30-2');
    },

    getResilienceSummary() {
        const { burnoutScore, stressLevel, sleepQuality, moodHistory } = this.user;
        const avgMood = moodHistory.reduce((a, b) => a + b, 0) / moodHistory.length;

        if (avgMood >= 4 && burnoutScore < 30) {
            return "Your emotional resilience is strong this week. Your consistent practice is building healthy stress response patterns. Consider maintaining your current routine and trying a deeper 21-minute session.";
        } else if (avgMood >= 3 && burnoutScore < 50) {
            return "You're showing moderate resilience with some stress accumulation. Your mid-week dip is common for high-responsibility roles. Focus on the 10-minute nervous system downregulation during afternoon slumps.";
        } else {
            return "Your stress indicators suggest accumulated pressure. This is a signal to prioritize recovery sessions this week. I recommend the Burnout Prevention Module and evening Sleep Preparation Protocol.";
        }
    },

    // Enterprise analytics data (anonymized, aggregated)
    analytics: {
        totalOrgSessions: 1240,
        dailyActive: 48,
        avgSessionLength: 18,
        topCategory: 'Stress',
        weeklyGrowth: 12,
        focusBreakdown: {
            'Stress': 35,
            'Sleep': 22,
            'Anxiety': 18,
            'Focus': 12,
            'Burnout': 8,
            'Depression': 5
        },
        wellbeingScore: 72,
        wellbeingTrend: 'up',
        recentOrgSessions: [
            { title: 'Morning Flow', time: '8:30 AM', duration: 15, participants: 12 },
            { title: 'Midnight Serenity', time: '10:00 PM', duration: 45, participants: 8 },
            { title: 'Focus Boost', time: '2:15 PM', duration: 10, participants: 23 },
            { title: 'Calm Reset', time: '4:00 PM', duration: 5, participants: 45 }
        ]
    }
};
